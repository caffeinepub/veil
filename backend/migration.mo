import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type Region = { #india; #global };

  type SubscriptionStatus = { #grace; #active; #expired };

  type User = {
    id : Principal;
    pseudonym : Text;
    region : Region;
    subscriptionStatus : SubscriptionStatus;
    subscriptionStartDate : Time.Time;
    inviteCode : Text;
    createdAt : Time.Time;
    suspended : Bool;
  };

  type InviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
  };

  type Actor = {
    users : Map.Map<Principal, User>;
    inviteCodes : Map.Map<Text, InviteCode>;
  };

  public func run(old : Actor) : Actor {
    // Filter out anonymous principal entries and keep only valid ones
    let cleanedUsers = old.users.filter(
      func(p, _) {
        not p.isAnonymous();
      }
    );

    // Re-seed default invite codes
    let defaultCodes = [
      "VEIL-001",
      "VEIL-002",
      "VEIL-003",
      "VEIL-004",
      "VEIL-005",
    ];
    for (code in defaultCodes.values()) {
      if (not old.inviteCodes.containsKey(code)) {
        let ic : InviteCode = {
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
