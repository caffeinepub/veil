import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Random "mo:core/Random";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import InviteLinksModule "invite-links/invite-links-module";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  let inviteState = InviteLinksModule.initState();
  include MixinAuthorization(accessControlState);

  // Persistent Variables
  let users : Map.Map<Principal, User> = Map.empty<Principal, User>();
  let posts = Map.empty<Text, Post>();
  let reactions = Map.empty<Text, Reaction>();
  let textReactions = Map.empty<Text, TextReaction>();
  let comments = Map.empty<Text, Comment>();
  let flags = Map.empty<Text, Flag>();
  let inviteCodes = Map.empty<Text, InviteCode>();
  let espFlaggedUsers = Map.empty<Principal, Bool>();
  let lastToggleTime = Map.empty<Text, Time.Time>();
  let emotionalAlertCounts = Map.empty<Principal, List.List<(Time.Time, Nat)>>();
  let directMessages = Map.empty<DirectMessageId, DirectMessage>();

  // Types

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

  public type Visibility = {
    #privateView;
    #publicView;
  };

  public type User = {
    id : Principal;
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    createdAt : Time.Time;
    suspended : Bool;
    hasAcknowledgedEntryMessage : Bool;
    hasAcknowledgedPublicPostMessage : Bool;
  };

  public type DirectMessage = {
    id : DirectMessageId;
    from : ?Principal;
    to : Principal;
    content : Text;
    timestamp : Time.Time;
    read : Bool;
    isCrisisResource : Bool;
  };

  public type Post = {
    id : Text;
    author : Principal;
    emotionType : EmotionType;
    content : Text;
    visibility : Visibility;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    flaggedForReview : ReviewFlag;
  };

  public type Reaction = {
    id : Text;
    postId : Text;
    author : Principal;
    reactionType : ReactionType;
    createdAt : Time.Time;
  };

  public type TextReaction = {
    id : Text;
    postId : Text;
    userId : Principal;
    reactionText : Text;
    createdAt : Time.Time;
  };

  public type Comment = {
    id : Text;
    postId : Text;
    userId : Principal;
    content : Text;
    createdAt : Int;
    flagged : Bool;
  };

  public type InviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
    creator : Principal;
    usageCount : Nat;
  };

  public type Flag = {
    id : Text;
    postId : Text;
    reporter : Principal;
    reason : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    suspended : Bool;
    hasAcknowledgedEntryMessage : Bool;
    hasAcknowledgedPublicPostMessage : Bool;
  };

  public type UserProfileUpdate = {
    pseudonym : Text;
    region : Region;
  };

  public type Result<Ok, Err> = {
    #ok : Ok;
    #err : Err;
  };

  public type SeatInfo = {
    currentSeats : Nat;
    maxSeats : Nat;
  };

  public type RegistrationError = {
    #AnonymousNotAllowed;
    #CapacityReached;
    #AlreadyRegistered;
    #InvalidInviteCode;
    #InviteCodeUsed;
  };

  public type ReviewFlag = {
    #none;
    #crisisRisk;
  };

  public type CrisisCheckResult = {
    riskFound : Bool;
    contentWithMatch : ?Text;
  };

  public type DirectMessageId = Text;
  public type MessageType = {
    #admin;
    #resource;
  };

  let MAX_USERS : Nat = 100;
  let SEVEN_DAYS_NS : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
  let BROKE_THRESHOLD : Nat = 3;
  let MAX_PRIVATE_POSTS_PER_DAY : Nat = 5;
  let ONE_DAY_NS : Int = 24 * 60 * 60 * 1_000_000_000;
  let MAX_CONTENT_LENGTH : Nat = 1000;
  let ADMIN_PRINCIPAL_HEX = "0aff83509158af0d11fbb222d877dee7e13f0c55";

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

  // CRISIS DETECTION LOGIC (BACKEND)
  func containsCrisisKeywords(content : Text) : CrisisCheckResult {
    let keywords = [
      "self-harm",
      "suicide",
      "kill myself",
      "end my life",
      "want to die",
      "hurt myself",
      "depressed",
      "hopeless",
      "no reason to live",
      "tired of living",
    ];

    let lowerContent = content.toLower();

    for (keyword in keywords.values()) {
      if (lowerContent.contains(#text(keyword))) {
        return {
          riskFound = true;
          contentWithMatch = ?content;
        };
      };
    };

    { riskFound = false; contentWithMatch = null };
  };

  func computeCrisisFlag(emotionType : EmotionType, visibility : Visibility, content : Text) : ReviewFlag {
    if (emotionType == #broke and visibility == #publicView) {
      let result = containsCrisisKeywords(content);
      if (result.riskFound) { #crisisRisk } else { #none };
    } else { #none };
  };

  public query ({ caller }) func getDirectMessagesForUser(_userId : Principal) : async [DirectMessage] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get direct messages");
    };
    if (caller != _userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only admins can get all direct messages");
    };
    let userMessages = directMessages.values().filter(func(m) { m.to == _userId }).toArray();
    userMessages.sort(
      func(a : DirectMessage, b : DirectMessage) : Order.Order {
        if (a.timestamp < b.timestamp) { #less } else if (a.timestamp > b.timestamp) {
          #greater;
        } else {
          #equal;
        };
      }
    );
  };

  public shared ({ caller }) func markDirectMessageAsRead(messageId : DirectMessageId) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot mark direct messages as read");
    };
    switch (directMessages.get(messageId)) {
      case (null) { Runtime.trap("Message does not exist") };
      case (?message) {
        if (message.to != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only mark your own messages as read");
        };
        let updated : DirectMessage = { message with read = true };
        directMessages.add(messageId, updated);
      };
    };
  };

  // Admin-only: send a direct message to a user. Never sent automatically.
  public shared ({ caller }) func sendAdminMessage(recipient : Principal, _messageType : MessageType, messageContent : Text) : async DirectMessageId {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can send admin messages");
    };

    let messageId = await generateUuid();
    let message : DirectMessage = {
      id = messageId;
      to = recipient;
      from = ?caller;
      content = messageContent;
      timestamp = Time.now();
      read = false;
      isCrisisResource = false;
    };
    directMessages.add(messageId, message);
    messageId;
  };

  // Admin-only: send a predefined crisis resource template message to a user. Never sent automatically.
  public shared ({ caller }) func sendCrisisResourceMessage(recipient : Principal, _messageType : MessageType) : async DirectMessageId {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can send crisis resource messages");
    };

    let crisisMessageContent = "It is okay to feel this way, but if you cannot see a way out right now please seek professional help: If you are in crisis, please reach out: International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/";

    let messageId = await generateUuid();
    let message : DirectMessage = {
      id = messageId;
      to = recipient;
      from = ?caller;
      content = crisisMessageContent;
      timestamp = Time.now();
      read = false;
      isCrisisResource = true;
    };
    directMessages.add(messageId, message);
    messageId;
  };

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
      creator = caller;
      usageCount = 0;
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

  public query func validateInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case (?ic) { not ic.used };
      case (null) { false };
    };
  };

  public shared ({ caller }) func revokeInviteCode(_code : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot revoke invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public shared ({ caller }) func register(
    pseudonym : Text,
    region : Region,
    inviteCode : Text
  ) : async Result<User, RegistrationError> {
    if (caller.isAnonymous()) {
      return #err(#AnonymousNotAllowed);
    };

    if (users.size() >= MAX_USERS) {
      return #err(#CapacityReached);
    };

    if (users.get(caller) != null) {
      return #err(#AlreadyRegistered);
    };

    switch (inviteCodes.get(inviteCode)) {
      case (?ic) {
        if (ic.used) {
          return #err(#InviteCodeUsed);
        };
      };
      case (null) { return #err(#InvalidInviteCode) };
    };

    let now = Time.now();
    let user : User = {
      id = caller;
      pseudonym;
      region;
      subscriptionStatus = #grace;
      createdAt = now;
      suspended = false;
      hasAcknowledgedEntryMessage = false;
      hasAcknowledgedPublicPostMessage = false;
    };

    users.add(caller, user);

    switch (inviteCodes.get(inviteCode)) {
      case (?ic) {
        let updatedIC : InviteCode = {
          code = inviteCode;
          created = ic.created;
          used = true;
          creator = ic.creator;
          usageCount = ic.usageCount + 1;
        };
        inviteCodes.add(inviteCode, updatedIC);
      };
      case (null) {};
    };

    #ok(user);
  };

  func requireRegisteredUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals are not allowed");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Only registered users can perform this action") };
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Your account has been suspended");
        };
      };
    };
  };

  func requireAdmin(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals are not allowed");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get user profiles");
    };
    switch (users.get(caller)) {
      case (?user) {
        ?{
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileUpdate) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot save user profiles");
    };
    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only registered users can save profiles");
      };
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Your account has been suspended");
        };
        let updated : User = {
          id = user.id;
          pseudonym = profile.pseudonym;
          region = profile.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(caller, updated);
      };
    };
  };

  public shared ({ caller }) func acknowledgeEntryMessage() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot acknowledge entry message");
    };
    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only registered users can perform this action");
      };
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Your account has been suspended");
        };
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = true;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(caller, updated);
      };
    };
  };

  public shared ({ caller }) func acknowledgePublicPostMessage() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot acknowledge public post message");
    };
    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only registered users can perform this action");
      };
      case (?user) {
        if (user.suspended) {
          Runtime.trap("Your account has been suspended");
        };
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = true;
        };
        users.add(caller, updated);
      };
    };
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get user profiles");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(userId)) {
      case (?user) {
        ?{
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
      };
      case (null) { null };
    };
  };

  func countWords(text : Text) : Nat {
    var count = 0;
    var inWord = false;
    for (c in text.chars()) {
      if (c == ' ' or c == '\n' or c == '\t') {
        inWord := false;
      } else {
        if (not inWord) {
          count += 1;
          inWord := true;
        };
      };
    };
    count;
  };

  func countBrokePostsLast7Days(author : Principal) : Nat {
    let now = Time.now();
    var count = 0;
    for (post in posts.values()) {
      if (post.author == author) {
        switch (post.emotionType) {
          case (#broke) {
            if (now - post.createdAt <= SEVEN_DAYS_NS) {
              count += 1;
            };
          };
          case (_) {};
        };
      };
    };
    count;
  };

  func countPrivatePostsToday(userId : Principal) : Nat {
    let today = Time.now() / (24 * 60 * 60 * 1_000_000_000);
    var count = 0;
    for (post in posts.values()) {
      if (post.author == userId and post.visibility == #privateView) {
        let postDay = post.createdAt / (24 * 60 * 60 * 1_000_000_000);
        if (postDay == today) {
          count += 1;
        };
      };
    };
    count;
  };

  public shared ({ caller }) func createPost(
    emotionType : EmotionType,
    content : Text,
    visibility : ?Visibility,
  ) : async Result<Post, Text> {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot create posts");
    };
    switch (users.get(caller)) {
      case (null) {
        return #err("Unauthorized: Only registered users can create posts");
      };
      case (?user) {
        if (user.suspended) {
          return #err("Your account has been suspended");
        };
      };
    };

    if (content.size() == 0) {
      return #err("Content cannot be empty");
    };
    if (content.size() > MAX_CONTENT_LENGTH) {
      return #err("Content exceeds maximum length of 1000 characters");
    };

    let resolvedVisibility : Visibility = switch (visibility) {
      case (?v) { v };
      case (null) { #privateView };
    };

    if (resolvedVisibility == #privateView) {
      let todayCount = countPrivatePostsToday(caller);
      if (todayCount >= MAX_PRIVATE_POSTS_PER_DAY) {
        return #err("Rate limit exceeded: You can only create 5 private posts per day");
      };
    };

    let postId = await generateUuid();
    let now = Time.now();

    // Crisis keyword check runs server-side on post creation for broke posts made public
    let flagForReview = computeCrisisFlag(emotionType, resolvedVisibility, content);

    let post : Post = {
      id = postId;
      author = caller;
      emotionType;
      content;
      visibility = resolvedVisibility;
      createdAt = now;
      updatedAt = now;
      flaggedForReview = flagForReview;
    };
    posts.add(postId, post);
    #ok(post);
  };

  public shared ({ caller }) func togglePostVisibility(postId : Text) : async Result<Post, Text> {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot toggle post visibility");
    };
    switch (users.get(caller)) {
      case (null) {
        return #err("Unauthorized: Only registered users can toggle post visibility");
      };
      case (?user) {
        if (user.suspended) {
          return #err("Your account has been suspended");
        };
      };
    };

    switch (posts.get(postId)) {
      case (null) {
        return #err("Post does not exist");
      };
      case (?post) {
        if (post.author != caller) {
          return #err("Unauthorized: You can only toggle visibility of your own posts");
        };

        let now = Time.now();
        switch (lastToggleTime.get(postId)) {
          case (?lastToggle) {
            if (now - lastToggle < ONE_DAY_NS) {
              return #err("Rate limit exceeded: You can only toggle visibility once per post per day");
            };
          };
          case (null) {};
        };

        let newVisibility : Visibility = switch (post.visibility) {
          case (#privateView) { #publicView };
          case (#publicView) { #privateView };
        };

        // Crisis keyword check runs server-side on visibility toggle to public for broke posts
        let newFlagForReview = computeCrisisFlag(post.emotionType, newVisibility, post.content);

        let updatedPost : Post = {
          id = post.id;
          author = post.author;
          emotionType = post.emotionType;
          content = post.content;
          visibility = newVisibility;
          createdAt = post.createdAt;
          updatedAt = now;
          flaggedForReview = newFlagForReview;
        };

        posts.add(postId, updatedPost);
        lastToggleTime.add(postId, now);
        #ok(updatedPost);
      };
    };
  };

  public query ({ caller }) func getESPStatus() : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot check ESP status");
    };
    switch (espFlaggedUsers.get(caller)) {
      case (?flagged) { flagged };
      case (null) { false };
    };
  };

  public query ({ caller }) func getPublicPosts() : async [Post] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot view posts");
    };
    requireRegisteredUser(caller);
    let publicPosts = posts.values().filter(func(p : Post) : Bool {
      p.visibility == #publicView;
    }).toArray();
    publicPosts.sort(
      func(a : Post, b : Post) : Order.Order {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal };
      }
    );
  };

  public query ({ caller }) func getMyPosts() : async [Post] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot view posts");
    };
    requireRegisteredUser(caller);
    let myPosts = posts.values().filter(func(p : Post) : Bool {
      p.author == caller;
    }).toArray();
    myPosts.sort(
      func(a : Post, b : Post) : Order.Order {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal };
      }
    );
  };

  public shared ({ caller }) func addReaction(postId : Text, reactionType : ReactionType) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot add reactions");
    };
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot react to a private post");
        };
        if (post.author == caller) {
          Runtime.trap("Cannot react to your own post");
        };
        if (hasUserReactedWithType(caller, postId, reactionType)) {
          Runtime.trap("You have already applied this reaction to this post");
        };

        let reactionId = await generateUuid();
        let reaction : Reaction = {
          id = reactionId;
          postId;
          author = caller;
          reactionType;
          createdAt = Time.now();
        };

        reactions.add(reactionId, reaction);
        reactionId;
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  func hasUserReactedWithType(userId : Principal, postId : Text, reactionType : ReactionType) : Bool {
    reactions.values().any(func(r : Reaction) : Bool {
      r.postId == postId and r.author == userId and r.reactionType == reactionType;
    });
  };

  public query ({ caller }) func getReactionsForPost(postId : Text) : async [Reaction] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot view reactions");
    };
    requireRegisteredUser(caller);
    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot view reactions on a private post");
        };
        reactions.values().filter(func(r : Reaction) : Bool {
          r.postId == postId;
        }).toArray();
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  public shared ({ caller }) func addTextReaction(postId : Text, reactionText : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot add reactions");
    };
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot react to a private post");
        };
        if (post.author == caller) {
          Runtime.trap("Cannot react to your own post");
        };
        if (hasUserReactedWithText(caller, postId)) {
          Runtime.trap("You have already reacted to this post");
        };

        let reactionId = await generateUuid();
        let reaction : TextReaction = {
          id = reactionId;
          postId;
          userId = caller;
          reactionText;
          createdAt = Time.now();
        };

        textReactions.add(reactionId, reaction);
        reactionId;
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  func hasUserReactedWithText(userId : Principal, postId : Text) : Bool {
    textReactions.values().any(func(r : TextReaction) : Bool {
      r.postId == postId and r.userId == userId;
    });
  };

  public query ({ caller }) func getTextReactionsForPost(postId : Text) : async [TextReaction] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot view reactions");
    };
    requireRegisteredUser(caller);
    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot view reactions on a private post");
        };
        textReactions.values().filter(func(r : TextReaction) : Bool {
          r.postId == postId;
        }).toArray();
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  public shared ({ caller }) func addComment(postId : Text, content : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot add comments");
    };
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot comment on a private post");
        };
        let commentId = await generateUuid();
        let comment : Comment = {
          id = commentId;
          postId;
          userId = caller;
          content;
          createdAt = Time.now();
          flagged = false;
        };
        comments.add(commentId, comment);
        commentId;
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  public query ({ caller }) func getCommentsByPost(postId : Text) : async [Comment] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot view comments");
    };
    requireRegisteredUser(caller);
    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot view comments on a private post");
        };
        let postComments = comments.values().filter(func(c : Comment) : Bool {
          c.postId == postId;
        }).toArray();

        postComments.sort(
          func(a, b) {
            if (a.createdAt < b.createdAt) { #less } else if (a.createdAt > b.createdAt) { #greater } else {
              #equal;
            };
          }
        );
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  public shared ({ caller }) func flagComment(commentId : Text) : async () {
    requireRegisteredUser(caller);
    switch (comments.get(commentId)) {
      case (?comment) {
        if (comment.flagged) {
          Runtime.trap("Comment is already flagged");
        };
        let updatedComment : Comment = { comment with flagged = true };
        comments.add(commentId, updatedComment);
      };
      case (null) {
        Runtime.trap("Comment does not exist");
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    requireAdmin(caller);
    switch (comments.get(commentId)) {
      case (?_) { comments.remove(commentId) };
      case (null) {
        Runtime.trap("Comment does not exist");
      };
    };
  };

  // An authenticated registered user may flag a post authored by another user.
  // Users must not be able to flag their own posts.
  public shared ({ caller }) func flagPost(postId : Text, reason : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot flag posts");
    };
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        if (post.visibility == #privateView) {
          Runtime.trap("Cannot flag a private post");
        };
        if (post.author == caller) {
          Runtime.trap("Unauthorized: You cannot flag your own post");
        };
        let flagId = await generateUuid();
        let flag : Flag = {
          id = flagId;
          postId;
          reporter = caller;
          reason;
          createdAt = Time.now();
        };
        flags.add(flagId, flag);
        flagId;
      };
      case (null) {
        Runtime.trap("Post does not exist");
      };
    };
  };

  public query ({ caller }) func adminGetFlaggedPosts() : async [Flag] {
    requireAdmin(caller);
    flags.values().toArray();
  };

  public query ({ caller }) func adminGetAllPosts() : async [Post] {
    requireAdmin(caller);
    posts.values().toArray();
  };

  public shared ({ caller }) func adminDeletePost(postId : Text) : async () {
    requireAdmin(caller);
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_) {
        posts.remove(postId);
        let commentIds = comments.values()
          .filter(func(c : Comment) : Bool { c.postId == postId })
          .map(func(c : Comment) : Text { c.id })
          .toArray();
        for (cid in commentIds.vals()) {
          comments.remove(cid);
        };
        let reactionIds = reactions.values()
          .filter(func(r : Reaction) : Bool { r.postId == postId })
          .map(func(r : Reaction) : Text { r.id })
          .toArray();
        for (rid in reactionIds.vals()) {
          reactions.remove(rid);
        };
      };
    };
  };

  public query ({ caller }) func adminGetAllUsers() : async [User] {
    requireAdmin(caller);
    users.values().toArray();
  };

  public shared ({ caller }) func adminSuspendUser(userId : Principal) : async () {
    requireAdmin(caller);
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = true;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(userId, updated);
      };
    };
  };

  public shared ({ caller }) func adminUnsuspendUser(userId : Principal) : async () {
    requireAdmin(caller);
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = false;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(userId, updated);
      };
    };
  };

  public shared ({ caller }) func adminSetSubscriptionStatus(
    userId : Principal,
    status : SubscriptionStatus
  ) : async () {
    requireAdmin(caller);
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = status;
          createdAt = user.createdAt;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(userId, updated);
      };
    };
  };

  public query ({ caller }) func adminGetUserPosts(userId : Principal) : async [Post] {
    requireAdmin(caller);
    posts.values().filter(func(p : Post) : Bool {
      p.author == userId;
    }).toArray();
  };

  public query func getSeatInfo() : async SeatInfo {
    {
      currentSeats = users.size();
      maxSeats = MAX_USERS;
    };
  };

  public query ({ caller }) func adminGetESPFlaggedUsers() : async [Principal] {
    requireAdmin(caller);
    espFlaggedUsers.keys().filter(func(p : Principal) : Bool {
      switch (espFlaggedUsers.get(p)) {
        case (?flagged) { flagged };
        case (null) { false };
      };
    }).toArray();
  };

  public shared ({ caller }) func adminClearESPFlag(userId : Principal) : async () {
    requireAdmin(caller);
    espFlaggedUsers.add(userId, false);
  };

  public query ({ caller }) func checkLoginStatus() : async { #newUser; #existingUser; #anonymous } {
    if (caller.isAnonymous()) {
      return #anonymous;
    };
    switch (users.get(caller)) {
      case (?_) { #existingUser };
      case (null) { #newUser };
    };
  };

  // ------------ ADMIN MODERATION ------------

  public shared ({ caller }) func adminPermanentlyRemoveUser(userId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?_) {
        // Remove all posts by user
        let userPosts = posts.values().filter(
          func(p) { p.author == userId }
        ).toArray();
        for (post in userPosts.values()) {
          posts.remove(post.id);
        };

        // Remove all comments by user
        for ((_, comment) in comments.entries()) {
          if (comment.userId == userId) {
            comments.remove(comment.id);
          };
        };

        // Remove all direct reactions
        for ((_, reaction) in reactions.entries()) {
          if (reaction.author == userId) {
            reactions.remove(reaction.id);
          };
        };

        // Remove all text reactions
        for ((_, tReaction) in textReactions.entries()) {
          if (tReaction.userId == userId) {
            textReactions.remove(tReaction.id);
          };
        };

        // Remove user flags (where they are reporter)
        for ((_, flag) in flags.entries()) {
          if (flag.reporter == userId) {
            flags.remove(flag.id);
          };
        };

        // Remove user record
        users.remove(userId);
      };
    };
  };

  public shared ({ caller }) func adminToggleUserSuspension(userId : Principal) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updated : User = { user with suspended = (not user.suspended) };
        users.add(userId, updated);
        updated.suspended;
      };
    };
  };

  public shared ({ caller }) func adminApplyPublicPostingCooldown(userId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updated : User = {
          id = user.id;
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          createdAt = user.createdAt;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        };
        users.add(userId, updated);
      };
    };
  };

  public shared ({ caller }) func adminRemovePost(postId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_) {
        posts.remove(postId);
      };
    };
  };

  public query ({ caller }) func adminGetAllUsersExtended() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    users.toArray().map(func((userId, user)) {
      (
        userId,
        {
          pseudonym = user.pseudonym;
          region = user.region;
          subscriptionStatus = user.subscriptionStatus;
          suspended = user.suspended;
          hasAcknowledgedEntryMessage = user.hasAcknowledgedEntryMessage;
          hasAcknowledgedPublicPostMessage = user.hasAcknowledgedPublicPostMessage;
        },
      );
    });
  };

  public query ({ caller }) func adminGetAllFlaggedPostsWithRecords() : async [(Text, [Flag])] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let flaggedPosts = posts.entries().filter(
      func((_, p)) { p.visibility == #publicView }
    );

    flaggedPosts.toArray().map(func((postId, _)) {
      let postFlags = flags.values().filter(func(f) { f.postId == postId }).toArray();
      (postId, postFlags);
    });
  };

  func processPostForEmotionalMonitoring(post : Post) {
    if (post.emotionType != #broke) { return };

    // Only process posts from the last 3 days
    let now = Time.now();
    let threeDaysAgo = now - (3 * 24 * 60 * 60 * 1_000_000_000);

    // Keep only records from the last 3 days
    let currentCounts = switch (emotionalAlertCounts.get(post.author)) {
      case (?counts) {
        counts.filter(
          func((timestamp, _)) {
            timestamp >= threeDaysAgo;
          }
        );
      };
      case (null) {
        List.empty<(Time.Time, Nat)>();
      };
    };

    // Add the current post
    currentCounts.add((now, 1));

    // Update state
    emotionalAlertCounts.add(post.author, currentCounts);

    // Check for emotional alert (3 posts within 3 days)
    let brokePostCount = currentCounts.toArray().size();
    if (brokePostCount >= 3) {
      let newPostCount = brokePostCount + 1;
      if (newPostCount >= 5) {
        addPermanentFlag(post.author);
      };
    };
  };

  func addPermanentFlag(_user : Principal) {};

  public query ({ caller }) func adminGetHighRiskEmotionAlerts() : async [(Principal, Nat)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let now = Time.now();
    let threeDaysAgo = now - (3 * 24 * 60 * 60 * 1_000_000_000);
    let highRiskUsers = List.empty<(Principal, Nat)>();

    for ((userId, dailyCounts) in emotionalAlertCounts.entries()) {
      let recentCounts = matchListByTime(dailyCounts, threeDaysAgo);
      let postCount = recentCounts.toArray().size();

      if (postCount >= 3) {
        highRiskUsers.add((userId, postCount));
      };
    };

    highRiskUsers.toArray();
  };

  func matchListByTime(list : List.List<(Time.Time, Nat)>, minTime : Time.Time) : List.List<(Time.Time, Nat)> {
    let matchingEntries = List.empty<(Time.Time, Nat)>();
    for ((timestamp, _) in list.values()) {
      if (timestamp >= minTime) {
        matchingEntries.add((timestamp, 1));
      };
    };
    matchingEntries;
  };
};
