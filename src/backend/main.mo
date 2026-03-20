import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Random "mo:core/Random";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Blob "mo:core/Blob";


import InviteLinksModule "invite-links/invite-links-module";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  let accessControlState = AccessControl.initState();
  let inviteState = InviteLinksModule.initState();
  include MixinAuthorization(accessControlState);

  // Persistent Variables
  let users = Map.empty<Principal, User>();
  let posts = Map.empty<Text, Post>();
  let reactions = Map.empty<Text, Reaction>();
  let textReactions = Map.empty<Text, TextReaction>();
  let inviteCodes = Map.empty<Text, InviteCode>();
  let espFlaggedUsers = Map.empty<Principal, Bool>();
  let lastToggleTime = Map.empty<Text, Time.Time>();
  let emotionalAlertCounts = Map.empty<Principal, List.List<(Time.Time, Nat)>>();
  let directMessages = Map.empty<DirectMessageId, DirectMessage>();
  let comments = Map.empty<Text, CommentV2>();
  let flags = Map.empty<Text, FlagV2>();

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
    publicPostingCooldownUntil : Time.Time;
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

  public type CommentV2 = {
    id : Text;
    postId : Text;
    commenter : Principal;
    pseudonym : Text;
    comment : Text;
    timestamp : Time.Time;
  };

  public type InviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
    creator : Principal;
    usageCount : Nat;
  };

  public type FlagV2 = {
    id : Text;
    postId : Text;
    reporter : Principal;
    reason : FlagReason;
    timestamp : Time.Time;
  };

  public type FlagReason = {
    #Offensive;
    #Spam;
    #Harassment;
    #Other : Text;
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

  // Only the recipient or an admin can view direct messages for a user
  public query ({ caller }) func getDirectMessagesForUser(userId : Principal) : async [DirectMessage] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get direct messages");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only admins can get all direct messages");
    };
    let userMessages = directMessages.values().filter(func(m) { m.to == userId }).toArray();
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

  // Only the recipient or an admin can mark a message as read
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

  // Admin-only: generate an invite code
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot generate invite codes");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
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

  // Public: submit an RSVP (no auth required)
  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  // Admin-only: get all RSVPs
  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get RSVPs");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  // Admin-only: list invite codes
  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot get invite codes");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };

  // Public: validate an invite code (needed on signup page before registration)
  public query func validateInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case (?ic) { not ic.used };
      case (null) { false };
    };
  };

  // Admin-only: revoke an invite code
  public shared ({ caller }) func revokeInviteCode(_code : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (inviteCodes.get(_code)) {
      case (null) { Runtime.trap("Invite code does not exist") };
      case (?ic) {
        let updated : InviteCode = { ic with used = true };
        inviteCodes.add(_code, updated);
      };
    };
  };

  // Public (non-anonymous): register with a valid invite code
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
      publicPostingCooldownUntil = 0;
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

  // Registered user: get own profile
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

  // Registered user: save own profile
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
          publicPostingCooldownUntil = user.publicPostingCooldownUntil;
        };
        users.add(caller, updated);
      };
    };
  };

  // Registered user: acknowledge entry message
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
          publicPostingCooldownUntil = user.publicPostingCooldownUntil;
        };
        users.add(caller, updated);
      };
    };
  };

  // Registered user: acknowledge public post message
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
          publicPostingCooldownUntil = user.publicPostingCooldownUntil;
        };
        users.add(caller, updated);
      };
    };
  };

  // Registered user can view own profile; admin can view any profile
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
  ) : async Result<Post, Text> {
    requireRegisteredUser(caller);

    if (content.size() == 0) {
      return #err("Content cannot be empty");
    };
    if (content.size() > MAX_CONTENT_LENGTH) {
      return #err("Content exceeds maximum length of 1000 characters");
    };

    let postId = await generateUuid();
    let now = Time.now();

    let post : Post = {
      id = postId;
      author = caller;
      emotionType;
      content;
      visibility = #privateView;
      createdAt = now;
      updatedAt = now;
      flaggedForReview = #none;
    };
    posts.add(postId, post);
    #ok(post);
  };

  /// *** COMMENTS STORE AND FLAG SYSTEM ***

  // Add a comment to a post
  public shared ({ caller }) func addComment(postId : Text, pseudonym : Text, commentText : Text) : async Text {
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (?post) {
        // Only allow comments on public posts
        switch (post.visibility) {
          case (#publicView) {};
          case (#privateView) { Runtime.trap("Comments only allowed on public posts") };
        };

        let commentId = await generateUuid();
        let newComment : CommentV2 = {
          id = commentId;
          postId;
          commenter = caller;
          pseudonym;
          comment = commentText;
          timestamp = Time.now();
        };
        comments.add(commentId, newComment);
        commentId;
      };
      case (null) { Runtime.trap("Target post does not exist") };
    };
  };

  // Get comments for a post - requires registered user
  public query ({ caller }) func getComments(postId : Text) : async [CommentV2] {
    requireRegisteredUser(caller);
    comments.values().filter(func(c) { c.postId == postId }).toArray();
  };

  // Admin-only: delete a comment
  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    requireAdmin(caller);
    switch (comments.get(commentId)) {
      case (?_comment) {
        comments.remove(commentId);
      };
      case (null) { Runtime.trap("Comment does not exist") };
    };
  };

  public shared ({ caller }) func flagPost(postId : Text, reason : FlagReason) : async Text {
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Target post does not exist") };
      case (?_) {
        let flagId = await generateUuid();
        let newFlag : FlagV2 = {
          id = flagId;
          postId;
          reporter = caller;
          reason;
          timestamp = Time.now();
        };
        flags.add(flagId, newFlag);
        flagId;
      };
    };
  };

  public query ({ caller }) func getFlags() : async [FlagV2] {
    requireAdmin(caller);
    Array.fromIter(flags.values());
  };

  // Admin-only: remove post and associated comments and flags
  public shared ({ caller }) func removePost(postId : Text) : async () {
    requireAdmin(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_) {
        posts.remove(postId);

        let commentsToRemove = comments.values().filter(func(c) { c.postId == postId }).toArray();
        commentsToRemove.values().forEach(func(comment) { comments.remove(comment.id) });

        let flagsToRemove = flags.values().filter(func(f) { f.postId == postId }).toArray();
        flagsToRemove.values().forEach(func(flag) { flags.remove(flag.id) });
      };
    };
  };

  // Registered (non-suspended) user: get all public posts (CHRONOLOGICAL, NO RANKING)
  public query ({ caller }) func getPublicPosts() : async [Post] {
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

  // GET SEAT INFO (ALL REQUESTED CHANGES BELOW HERE)
  public query func getSeatInfo() : async SeatInfo {
    {
      currentSeats = users.size();
      maxSeats = MAX_USERS;
    };
  };

  // GET ALL USER POSTS (DESC CHRONO, NO LIMIT)
  public query ({ caller }) func getMyPosts() : async [Post] {
    requireRegisteredUser(caller);
    let myPosts = posts.values().filter(func(p) { p.author == caller }).toArray();
    myPosts.sort(
      func(a, b) {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal };
      }
    );
  };

  // TOGGLE POST VISIBILITY (PRIVATE <-> PUBLIC)
  public shared ({ caller }) func togglePostVisibility(postId : Text) : async Result<Post, Text> {
    requireRegisteredUser(caller);

    switch (posts.get(postId)) {
      case (null) {
        return #err("Post does not exist");
      };
      case (?post) {
        if (post.author != caller) {
          return #err("Unauthorized: Can only toggle your own posts");
        };

        switch (post.visibility) {
          case (#privateView) {
            switch (users.get(caller)) {
              case (null) {
                return #err("Unauthorized: User does not exist");
              };
              case (?user) {
                if (user.suspended) {
                  return #err("Account suspended. Cannot make posts public");
                };
                if (user.subscriptionStatus == #expired) {
                  return #err("Subscription expired. Cannot make posts public");
                };
                if (Time.now() < user.publicPostingCooldownUntil) {
                  return #err("You are currently in a posting cooldown period. Try again later");
                };
              };
            };
            let updated : Post = {
              post with
              visibility = #publicView;
              updatedAt = Time.now();
              flaggedForReview = computeCrisisFlag(post.emotionType, #publicView, post.content);
            };
            posts.add(postId, updated);
            #ok(updated);
          };
          case (#publicView) {
            let updated : Post = {
              post with
              visibility = #privateView;
              updatedAt = Time.now();
              flaggedForReview = computeCrisisFlag(post.emotionType, #privateView, post.content);
            };
            posts.add(postId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  // SUSPEND USER (ADMIN ONLY)
  public shared ({ caller }) func suspendUser(userId : Principal) : async () {
    requireAdmin(caller);

    switch (users.get(userId)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (?user) {
        let updated : User = {
          user with
          suspended = true;
        };
        users.add(userId, updated);
      };
    };
  };

  // UNSUSPEND USER (ADMIN ONLY)
  public shared ({ caller }) func unsuspendUser(userId : Principal) : async () {
    requireAdmin(caller);

    switch (users.get(userId)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (?user) {
        let updated : User = {
          user with
          suspended = false;
        };
        users.add(userId, updated);
      };
    };
  };

  // PERMANENTLY REMOVE USER (ADMIN ONLY)
  public shared ({ caller }) func permanentlyRemoveUser(userId : Principal) : async () {
    requireAdmin(caller);

    switch (users.get(userId)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (_) {
        users.remove(userId);

        // Remove posts (and associated comments/flags)
        let postsToRemove = posts.values().filter(func(p) { p.author == userId }).toArray();
        postsToRemove.values().forEach(func(post) {
          let commentsToRemove = comments.values().filter(func(c) { c.postId == post.id }).toArray();
          commentsToRemove.values().forEach(func(comment) { comments.remove(comment.id) });
          let flagsToRemove = flags.values().filter(func(f) { f.postId == post.id }).toArray();
          flagsToRemove.values().forEach(func(flag) { flags.remove(flag.id) });
          posts.remove(post.id);
        });
      };
    };
  };

  // APPLY PUBLIC POSTING COOLDOWN (24H ADMIN TOOL)
  public shared ({ caller }) func applyPublicPostingCooldown(userId : Principal) : async () {
    requireAdmin(caller);

    switch (users.get(userId)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (?user) {
        let updated : User = {
          user with
          publicPostingCooldownUntil = Time.now() + ONE_DAY_NS;
        };
        users.add(userId, updated);
      };
    };
  };

  // GET ALL USERS (ADMIN ONLY)
  public query ({ caller }) func getAllAdminUsers() : async [User] {
    requireAdmin(caller);
    Array.fromIter(users.values());
  };
};

