import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Random "mo:core/Random";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import Order "mo:core/Order";



actor {
  let inviteState = InviteLinksModule.initState();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var adminPrincipal : ?Principal = null;

  let users = Map.empty<Principal, User>();
  let posts = Map.empty<Text, RawPost>();
  let reactions = Map.empty<Text, Reaction>();
  let inviteCodes = Map.empty<Text, InviteCode>();

  public shared ({ caller }) func initializeAdmin() : async () {
    switch (adminPrincipal) {
      case (?_) { Runtime.trap("Admin already initialized") };
      case (null) {
        if (caller.isAnonymous()) {
          Runtime.trap("Anonymous principal cannot be admin");
        };
        AccessControl.initialize(accessControlState, caller, "", "");
        adminPrincipal := ?caller;
      };
    };
  };

  func getAdminPrincipal() : Principal {
    switch (adminPrincipal) {
      case (?p) { p };
      case (null) { Runtime.trap("Admin not initialized") };
    };
  };

  func assertIsAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func assertIsUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  public type Region = {
    #india;
    #global;
  };

  public type SubscriptionStatus = {
    #grace;
    #active;
    #expired;
  };

  public type EmotionType = {
    #confess;
    #broke;
    #happy;
  };

  public type ReactionType = {
    #support;
    #care;
    #strength;
  };

  public type User = {
    id : Principal;
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    subscriptionStartDate : Time.Time;
    inviteCode : Text;
    createdAt : Time.Time;
    suspended : Bool;
  };

  public type RawPost = {
    id : Text;
    userId : Principal;
    emotionType : EmotionType;
    content : Text;
    isPrivate : Bool;
    reactionCount : Nat;
    editable : Bool;
    createdAt : Time.Time;
  };

  public type Post = {
    id : Text;
    userId : Principal;
    emotionType : EmotionType;
    content : Text;
    isPrivate : Bool;
    reactionCount : Nat;
    editable : Bool;
    createdAt : Time.Time;
  };

  public type Reaction = {
    id : Text;
    postId : Text;
    userId : Principal;
    reactionType : ReactionType;
    createdAt : Time.Time;
  };

  public type InviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
  };

  public type UserProfile = {
    pseudonym : Text;
    region : Region;
  };

  let MAX_USERS : Nat = 100;

  func effectiveSubscriptionStatus(user : User) : SubscriptionStatus {
    let fifteenDaysNs : Int = 15 * 24 * 60 * 60 * 1_000_000_000;
    let elapsed : Int = Time.now() - user.subscriptionStartDate;
    if (elapsed <= fifteenDaysNs) {
      return #grace;
    };
    user.subscriptionStatus;
  };

  func hasMinimumWordCount(content : Text, minWords : Nat) : Bool {
    let words = content.split(#char(' ')).toArray();
    let nonEmpty = words.filter(func(w) { w != "" });
    nonEmpty.size() >= minWords;
  };

  func toPost(rawPost : RawPost) : Post {
    {
      id = rawPost.id;
      userId = rawPost.userId;
      emotionType = rawPost.emotionType;
      content = rawPost.content;
      isPrivate = rawPost.isPrivate;
      reactionCount = rawPost.reactionCount;
      editable = rawPost.editable;
      createdAt = rawPost.createdAt;
    };
  };

  func comparePosts(a : Post, b : Post) : Order.Order {
    if (a.createdAt < b.createdAt) {
      #less;
    } else if (a.createdAt > b.createdAt) {
      #greater;
    } else { #equal };
  };

  // ─── Invite Code Management ───────────────────────────────────────────────

  public shared ({ caller }) func generateInviteCode() : async Text {
    assertIsAdmin(caller);
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    let ic : InviteCode = {
      code;
      created = Time.now();
      used = false;
    };
    inviteCodes.add(code, ic);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    assertIsAdmin(caller);
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    assertIsAdmin(caller);
    InviteLinksModule.getInviteCodes(inviteState);
  };

  public query func validateInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case (?ic) { not ic.used };
      case (null) { false };
    };
  };

  public shared ({ caller }) func addInviteCode(code : Text) : async () {
    assertIsAdmin(caller);
    let ic : InviteCode = {
      code;
      created = Time.now();
      used = false;
    };
    inviteCodes.add(code, ic);
  };

  public shared ({ caller }) func revokeInviteCode(code : Text) : async () {
    assertIsAdmin(caller);
    switch (inviteCodes.get(code)) {
      case (?ic) {
        if (ic.used) {
          Runtime.trap("Cannot revoke an already-used invite code");
        };
        inviteCodes.remove(code);
      };
      case (null) {
        Runtime.trap("Invite code does not exist");
      };
    };
  };

  // ─── User Registration ────────────────────────────────────────────────────

  public shared ({ caller }) func register(pseudonym : Text, region : Region, inviteCode : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register");
    };
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Already registered");
    };
    switch (inviteCodes.get(inviteCode)) {
      case (?ic) {
        if (ic.used) {
          Runtime.trap("Invite code has already been used");
        };
      };
      case (null) {
        Runtime.trap("Invalid invite code");
      };
    };
    if (users.size() >= MAX_USERS) {
      Runtime.trap("User capacity reached (max 100 users)");
    };

    let now = Time.now();
    let user : User = {
      id = caller;
      pseudonym;
      region;
      subscriptionStatus = #grace;
      subscriptionStartDate = now;
      inviteCode;
      createdAt = now;
      suspended = false;
    };

    users.add(caller, user);

    switch (inviteCodes.get(inviteCode)) {
      case (?ic) {
        let updatedIc = {
          code = ic.code;
          created = ic.created;
          used = true;
        };
        inviteCodes.add(inviteCode, updatedIc);
      };
      case (null) {};
    };

    let admin = getAdminPrincipal();
    AccessControl.assignRole(accessControlState, admin, caller, #user);
  };

  // ─── UserProfile (required by frontend) ──────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    assertIsUser(caller);
    switch (users.get(caller)) {
      case (?user) {
        ?{ pseudonym = user.pseudonym; region = user.region };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    assertIsUser(caller);
    switch (users.get(caller)) {
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = profile.pseudonym;
          region = profile.region;
          subscriptionStatus = user.subscriptionStatus;
          subscriptionStartDate = user.subscriptionStartDate;
          inviteCode = user.inviteCode;
          createdAt = user.createdAt;
          suspended = user.suspended;
        };
        users.add(caller, updated);
      };
      case (null) {
        Runtime.trap("User record not found");
      };
    };
  };

  public query ({ caller }) func getUserProfile(target : Principal) : async ?UserProfile {
    if (caller != target and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(target)) {
      case (?user) {
        ?{ pseudonym = user.pseudonym; region = user.region };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getMyProfile() : async ?User {
    assertIsUser(caller);
    users.get(caller);
  };

  public query ({ caller }) func getMyPosts() : async [Post] {
    assertIsUser(caller);
    posts.values()
      .filter(func(p : RawPost) : Bool { p.userId == caller })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public query func getPublicPosts() : async [Post] {
    posts.values()
      .filter(func(p : RawPost) : Bool { not p.isPrivate })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ─── Subscription ─────────────────────────────────────────────────────────

  public query ({ caller }) func getSubscriptionStatus(userId : Principal) : async SubscriptionStatus {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscription status");
    };
    switch (users.get(userId)) {
      case (?user) { effectiveSubscriptionStatus(user) };
      case (null) { #expired };
    };
  };

  public query ({ caller }) func getMySubscriptionStatus() : async SubscriptionStatus {
    assertIsUser(caller);
    switch (users.get(caller)) {
      case (?user) { effectiveSubscriptionStatus(user) };
      case (null) { #expired };
    };
  };

  public shared ({ caller }) func setSubscriptionStatus(userId : Principal, status : SubscriptionStatus) : async () {
    assertIsAdmin(caller);
    switch (users.get(userId)) {
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = status;
          subscriptionStartDate = user.subscriptionStartDate;
          inviteCode = user.inviteCode;
          createdAt = user.createdAt;
          suspended = user.suspended;
        };
        users.add(userId, updated);
      };
      case (null) {
        Runtime.trap("User does not exist");
      };
    };
  };

  // ─── Post Creation ────────────────────────────────────────────────────────

  public shared ({ caller }) func createPost(emotionType : EmotionType, content : Text) : async Text {
    assertIsUser(caller);

    switch (users.get(caller)) {
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Suspended users cannot create posts");
        };
        let status = effectiveSubscriptionStatus(user);
        if (status == #expired) {
          Runtime.trap("Subscription expired: cannot create posts");
        };
        if (emotionType != #broke and not hasMinimumWordCount(content, 24)) {
          Runtime.trap("Content must have at least 24 words for this emotion type");
        };
      };
      case (null) {
        Runtime.trap("User record not found");
      };
    };

    let postId = await generateUuid();
    let post : RawPost = {
      id = postId;
      userId = caller;
      emotionType;
      content;
      isPrivate = true;
      reactionCount = 0;
      editable = true;
      createdAt = Time.now();
    };

    posts.add(postId, post);
    postId;
  };

  func generateUuid() : async Text {
    let blob = await Random.blob();
    let bytes = Blob.toArray(blob);
    var result = "";
    let hex = "0123456789abcdef";
    let hexChars = hex.toArray();
    for (b in bytes.vals()) {
      let hi = b.toNat() / 16;
      let lo = b.toNat() % 16;
      result := result # Text.fromChar(hexChars[hi]) # Text.fromChar(hexChars[lo]);
    };
    result;
  };

  // ─── Post Editing ─────────────────────────────────────────────────────────

  public shared ({ caller }) func editPost(postId : Text, newContent : Text) : async () {
    assertIsUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.userId != caller) {
          Runtime.trap("Cannot edit posts you do not own");
        };
        if (not post.editable) {
          Runtime.trap("Post is no longer editable (has reactions)");
        };
        if (post.emotionType != #broke and not hasMinimumWordCount(newContent, 24)) {
          Runtime.trap("Content must have at least 24 words for this emotion type");
        };

        let updated : RawPost = {
          id = post.id;
          userId = post.userId;
          emotionType = post.emotionType;
          content = newContent;
          isPrivate = post.isPrivate;
          reactionCount = post.reactionCount;
          editable = post.editable;
          createdAt = post.createdAt;
        };
        posts.add(postId, updated);
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  // ─── Privacy Toggle ───────────────────────────────────────────────────────

  public shared ({ caller }) func setPostPrivacy(postId : Text, isPrivate : Bool) : async () {
    assertIsUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.userId != caller) {
          Runtime.trap("Cannot update privacy for posts you do not own");
        };

        if (not isPrivate) {
          switch (users.get(caller)) {
            case (?user) {
              if (user.suspended) {
                Runtime.trap("Suspended users cannot make posts public");
              };
              let status = effectiveSubscriptionStatus(user);
              if (status == #expired) {
                Runtime.trap("Subscription expired: cannot make posts public");
              };
            };
            case (null) {
              Runtime.trap("User record not found");
            };
          };
        };

        let updated : RawPost = {
          id = post.id;
          userId = post.userId;
          emotionType = post.emotionType;
          content = post.content;
          isPrivate;
          reactionCount = post.reactionCount;
          editable = post.editable;
          createdAt = post.createdAt;
        };
        posts.add(postId, updated);
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  // ─── Reactions ────────────────────────────────────────────────────────────

  public shared ({ caller }) func addReaction(postId : Text, reactionType : ReactionType) : async Text {
    assertIsUser(caller);

    switch (users.get(caller)) {
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Suspended users cannot react to posts");
        };
      };
      case (null) {
        Runtime.trap("User record not found");
      };
    };

    switch (posts.get(postId)) {
      case (?post) {
        if (post.isPrivate) {
          Runtime.trap("Cannot react to private posts");
        };
        if (post.userId == caller) {
          Runtime.trap("Cannot react to your own post");
        };
        if (hasUserReactedToPost(caller, postId)) {
          Runtime.trap("You have already reacted to this post");
        };

        let reactionId = await generateUuid();
        let reaction : Reaction = {
          id = reactionId;
          postId;
          userId = caller;
          reactionType;
          createdAt = Time.now();
        };

        reactions.add(reactionId, reaction);

        let updatedPost : RawPost = {
          id = post.id;
          userId = post.userId;
          emotionType = post.emotionType;
          content = post.content;
          isPrivate = post.isPrivate;
          reactionCount = post.reactionCount + 1;
          editable = false;
          createdAt = post.createdAt;
        };
        posts.add(postId, updatedPost);

        reactionId;
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  func hasUserReactedToPost(userId : Principal, postId : Text) : Bool {
    reactions.values().any(func(r : Reaction) : Bool {
      r.postId == postId and r.userId == userId;
    });
  };

  public query ({ caller }) func getMyReaction(postId : Text) : async ?ReactionType {
    assertIsUser(caller);
    switch (
      reactions.values().find(func(r : Reaction) : Bool {
        r.postId == postId and r.userId == caller;
      })
    ) {
      case (?r) { ?r.reactionType };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserReactionOnPost(postId : Text) : async ?Reaction {
    assertIsUser(caller);
    reactions.values().find(func(r : Reaction) : Bool {
      r.postId == postId and r.userId == caller;
    });
  };

  // ─── Post Deletion (Owner) ────────────────────────────────────────────────

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    assertIsUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.userId != caller) {
          Runtime.trap("Cannot delete posts you do not own");
        };

        let toRemove = reactions.filter(func(_ : Text, r : Reaction) : Bool {
          r.postId == postId;
        });
        for ((rid, _) in toRemove.entries()) {
          reactions.remove(rid);
        };

        posts.remove(postId);
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  // ─── Admin Moderation ────────────────────────────────────────────────────

  public query ({ caller }) func adminGetAllPublicPosts() : async [Post] {
    assertIsAdmin(caller);
    posts.values()
      .filter(func(p : RawPost) : Bool { not p.isPrivate })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public query ({ caller }) func adminGetUserPosts(userId : Principal) : async [Post] {
    assertIsAdmin(caller);
    posts.values()
      .filter(func(p : RawPost) : Bool { p.userId == userId })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public shared ({ caller }) func adminDeletePost(postId : Text) : async () {
    assertIsAdmin(caller);

    let toRemove = reactions.filter(func(_ : Text, r : Reaction) : Bool {
      r.postId == postId;
    });
    for ((rid, _) in toRemove.entries()) {
      reactions.remove(rid);
    };

    posts.remove(postId);
  };

  public shared ({ caller }) func adminSuspendUser(userId : Principal) : async () {
    assertIsAdmin(caller);
    switch (users.get(userId)) {
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          subscriptionStartDate = user.subscriptionStartDate;
          inviteCode = user.inviteCode;
          createdAt = user.createdAt;
          suspended = true;
        };
        users.add(userId, updated);
      };
      case (null) {
        Runtime.trap("User does not exist");
      };
    };
  };

  public shared ({ caller }) func adminUnsuspendUser(userId : Principal) : async () {
    assertIsAdmin(caller);
    switch (users.get(userId)) {
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          subscriptionStartDate = user.subscriptionStartDate;
          inviteCode = user.inviteCode;
          createdAt = user.createdAt;
          suspended = false;
        };
        users.add(userId, updated);
      };
      case (null) {
        Runtime.trap("User does not exist");
      };
    };
  };

  public query ({ caller }) func adminGetAllUsers() : async [User] {
    assertIsAdmin(caller);
    users.values().toArray();
  };
};


