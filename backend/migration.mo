import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
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

  public type OldUser = {
    id : Principal;
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    subscriptionStartDate : Time.Time;
    inviteCode : Text;
    createdAt : Time.Time;
    suspended : Bool;
  };

  public type OldRawPost = {
    id : Text;
    userId : Principal;
    emotionType : EmotionType;
    content : Text;
    isPrivate : Bool;
    reactionCount : Nat;
    editable : Bool;
    createdAt : Time.Time;
  };

  public type OldPost = {
    id : Text;
    userId : Principal;
    emotionType : EmotionType;
    content : Text;
    isPrivate : Bool;
    reactionCount : Nat;
    editable : Bool;
    createdAt : Time.Time;
  };

  public type OldReaction = {
    id : Text;
    postId : Text;
    userId : Principal;
    reactionType : ReactionType;
    createdAt : Time.Time;
  };

  public type OldInviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
  };

  public type OldActor = {
    users : Map.Map<Principal, OldUser>;
    posts : Map.Map<Text, OldRawPost>;
    reactions : Map.Map<Text, OldReaction>;
    inviteCodes : Map.Map<Text, OldInviteCode>;
  };

  public type NewUser = {
    id : Principal;
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    createdAt : Time.Time;
    suspended : Bool;
  };

  public type NewPost = {
    id : Text;
    author : Principal;
    emotionType : EmotionType;
    content : Text;
    isPrivate : Bool;
    createdAt : Time.Time;
  };

  public type NewReaction = {
    id : Text;
    postId : Text;
    author : Principal;
    reactionType : ReactionType;
    createdAt : Time.Time;
  };

  public type NewInviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
    creator : Principal;
    usageCount : Nat;
  };

  public type NewActor = {
    users : Map.Map<Principal, NewUser>;
    posts : Map.Map<Text, NewPost>;
    reactions : Map.Map<Text, NewReaction>;
    inviteCodes : Map.Map<Text, NewInviteCode>;
  };

  public func run(old : OldActor) : NewActor {
    let users = old.users.map<Principal, OldUser, NewUser>(
      func(_id, oldUser) {
        {
          id = oldUser.id;
          pseudonym = oldUser.pseudonym;
          region = oldUser.region;
          subscriptionStatus = oldUser.subscriptionStatus;
          createdAt = oldUser.createdAt;
          suspended = oldUser.suspended;
        };
      }
    );

    let posts = old.posts.map<Text, OldRawPost, NewPost>(
      func(_id, rawPost) {
        {
          id = rawPost.id;
          author = rawPost.userId;
          emotionType = rawPost.emotionType;
          content = rawPost.content;
          isPrivate = rawPost.isPrivate;
          createdAt = rawPost.createdAt;
        };
      }
    );

    let reactions = old.reactions.map<Text, OldReaction, NewReaction>(
      func(_id, oldReaction) {
        {
          id = oldReaction.id;
          postId = oldReaction.postId;
          author = oldReaction.userId;
          reactionType = oldReaction.reactionType;
          createdAt = oldReaction.createdAt;
        };
      }
    );

    let inviteCodes = old.inviteCodes.map<Text, OldInviteCode, NewInviteCode>(
      func(_code, oldInviteCode) {
        {
          code = oldInviteCode.code;
          created = oldInviteCode.created;
          used = oldInviteCode.used;
          creator = Principal.anonymous();
          usageCount = 0;
        };
      }
    );

    {
      users;
      posts;
      reactions;
      inviteCodes;
    };
  };
};
