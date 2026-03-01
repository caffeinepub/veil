import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type User = {
    id : Principal;
    pseudonym : Text;
    region : {
      #india;
      #global;
    };
    subscriptionStatus : {
      #grace;
      #active;
      #expired;
    };
    subscriptionStartDate : Int;
    inviteCode : Text;
    createdAt : Int;
    suspended : Bool;
  };

  type Actor = {
    users : Map.Map<Principal, User>;
    inviteCodes : Map.Map<Text, { code : Text; created : Int; used : Bool }>;
  };

  func removeAnonymousUsers(users : Map.Map<Principal, User>) : Map.Map<Principal, User> {
    users.filter(
      func(principal, _) {
        not principal.isAnonymous();
      }
    );
  };

  public func run(old : Actor) : Actor {
    let cleanedUsers = removeAnonymousUsers(old.users);

    let defaultCodes = [
      "VEIL-001",
      "VEIL-002",
      "VEIL-003",
      "VEIL-004",
      "VEIL-005",
    ];
    for (code in defaultCodes.values()) {
      if (not old.inviteCodes.containsKey(code)) {
        let ic = {
          code;
          created = Time.now();
          used = false;
        };
        old.inviteCodes.add(code, ic);
      };
    };

    { old with users = cleanedUsers };
  };
};
