import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Time "mo:core/Time";
import Random "mo:core/Random";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import InviteCodeModule "invite-links/invite-links-module";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  let inviteState = InviteLinksModule.initState();
  include MixinAuthorization(accessControlState);

  let users = Map.empty<Principal, User>();
  let posts = Map.empty<Text, RawPost>();
  let reactions = Map.empty<Text, Reaction>();
  let inviteCodes = Map.empty<Text, InviteCode>();

  public type Region = {
    #India;
    #Global;
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

  public type Result<Ok, Err> = {
    #ok : Ok;
    #err : Err;
  };

  let MAX_USERS : Nat = 100;

  func seedDefaultInviteCodes() {
    let defaultCodes = [
      "VEIL-001",
      "VEIL-002",
      "VEIL-003",
      "VEIL-004",
      "VEIL-005",
    ];
    for (code in defaultCodes.values()) {
      if (not inviteCodes.containsKey(code)) {
        let ic : InviteCode = {
          code;
          created = Time.now();
          used = false;
        };
        inviteCodes.add(code, ic);
      };
    };
  };

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

  // ---------------------------------------------------------------------------
  // Invite-links module wrappers
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot generate invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get RSVPs");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };

  // ---------------------------------------------------------------------------
  // Invite code management (application-level)
  // ---------------------------------------------------------------------------

  public query ({ caller }) func validateInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case (?ic) { not ic.used };
      case (null) { false };
    };
  };

  public shared ({ caller }) func addInviteCode(code : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot add invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let ic : InviteCode = {
      code;
      created = Time.now();
      used = false;
    };
    inviteCodes.add(code, ic);
  };

  public shared ({ caller }) func revokeInviteCode(code : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot revoke invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
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

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func register(
    pseudonym : Text,
    region : Region
  ) : async Result<User, Text> {
    if (caller.isAnonymous()) {
      return #err("Anonymous principals cannot register");
    };
    if (isPrincipalRegistered(caller)) {
      return #err("Already registered");
    };
    if (users.size() >= MAX_USERS) {
      return #err("User capacity reached (max 100 users)");
    };

    let now = Time.now();
    let user : User = {
      id = caller;
      pseudonym;
      region;
      subscriptionStatus = #grace;
      subscriptionStartDate = now;
      inviteCode = "open-registration";
      createdAt = now;
      suspended = false;
    };

    users.add(caller, user);

    let admin = getAdminPrincipal();
    AccessControl.assignRole(accessControlState, admin, caller, #user);

    #ok(user);
  };

  public shared ({ caller }) func adminRegister(
    pseudonym : Text,
    region : Region
  ) : async Result<User, Text> {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (users.size() >= MAX_USERS) {
      return #err("User capacity reached (max 100 users)");
    };

    let now = Time.now();
    let user : User = {
      id = caller;
      pseudonym;
      region;
      subscriptionStatus = #grace;
      subscriptionStartDate = now;
      inviteCode = "ADMIN_BYPASS";
      createdAt = now;
      suspended = false;
    };

    users.add(caller, user);
    AccessControl.assignRole(accessControlState, caller, caller, #user);

    #ok(user);
  };

  // ---------------------------------------------------------------------------
  // User profile (required by frontend contract)
  // ---------------------------------------------------------------------------

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get user profiles");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
    switch (users.get(caller)) {
      case (?user) {
        ?{ pseudonym = user.pseudonym; region = user.region };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot save user profiles");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
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
    if (target.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have user profiles");
    };
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

  // ---------------------------------------------------------------------------
  // Profile / subscription helpers
  // ---------------------------------------------------------------------------

  public query ({ caller }) func getMyProfile() : async ?User {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have profiles");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
    users.get(caller);
  };

  public query ({ caller }) func getMyPosts() : async [Post] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have posts");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
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
    if (caller.isAnonymous()) {
      return false;
    };
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getSubscriptionStatus(userId : Principal) : async SubscriptionStatus {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot query subscription statuses");
    };
    if (userId.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have subscription statuses");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscription status");
    };
    switch (users.get(userId)) {
      case (?user) { effectiveSubscriptionStatus(user) };
      case (null) { #expired };
    };
  };

  public query ({ caller }) func getMySubscriptionStatus() : async SubscriptionStatus {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have subscription statuses");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
    switch (users.get(caller)) {
      case (?user) { effectiveSubscriptionStatus(user) };
      case (null) { #expired };
    };
  };

  public shared ({ caller }) func setSubscriptionStatus(userId : Principal, status : SubscriptionStatus) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot set subscription statuses");
    };
    if (userId.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have subscription statuses");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
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

  // ---------------------------------------------------------------------------
  // Posts
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func createPost(emotionType : EmotionType, content : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot create posts");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };

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
    let bytes = blob.toArray();
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

  public shared ({ caller }) func editPost(postId : Text, newContent : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot edit posts");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };

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

  public shared ({ caller }) func setPostPrivacy(postId : Text, isPrivate : Bool) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot set post privacy");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };

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

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot delete posts");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };

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

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func addReaction(postId : Text, reactionType : ReactionType) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot add reactions");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };

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
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have reactions");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have reactions");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
    reactions.values().find(func(r : Reaction) : Bool {
      r.postId == postId and r.userId == caller;
    });
  };

  // ---------------------------------------------------------------------------
  // Admin functions
  // ---------------------------------------------------------------------------

  public query ({ caller }) func adminGetAllPublicPosts() : async [Post] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get posts");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    posts.values()
      .filter(func(p : RawPost) : Bool { not p.isPrivate })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public query ({ caller }) func adminGetUserPosts(userId : Principal) : async [Post] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get posts");
    };
    if (userId.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot have posts");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    posts.values()
      .filter(func(p : RawPost) : Bool { p.userId == userId })
      .map<RawPost, Post>(toPost)
      .toArray()
      .sort<Post>(comparePosts);
  };

  public shared ({ caller }) func adminDeletePost(postId : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot delete posts");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let toRemove = reactions.filter(func(_ : Text, r : Reaction) : Bool {
      r.postId == postId;
    });
    for ((rid, _) in toRemove.entries()) {
      reactions.remove(rid);
    };

    posts.remove(postId);
  };

  public shared ({ caller }) func adminSuspendUser(userId : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot suspend users");
    };
    if (userId.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot be suspended");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot unsuspend users");
    };
    if (userId.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot be suspended");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get users");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    users.values()
      .filter(func(u : User) : Bool { not u.id.isAnonymous() })
      .toArray();
  };

  // Kept for interface compatibility; always traps — admin is fixed at deploy time.
  public shared ({ caller }) func initializeAdmin() : async () {
    Runtime.trap("Fixed admin principal cannot be initialized at runtime");
  };

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  func getAdminPrincipal() : Principal {
    let adminPrincipalText = "rociw-xjdyx-6m42s-ocjv2-d62ps-j25ql-7qann-npfh6-tuukv-53biq-agent";
    Principal.fromText(adminPrincipalText);
  };

  func isPrincipalRegistered(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  system func preupgrade() { seedDefaultInviteCodes() };
};
