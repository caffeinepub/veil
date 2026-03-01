import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type User = {
    id : Principal;
    pseudonym : Text;
    region : { #India; #Global };
    subscriptionStatus : { #grace; #active; #expired };
    subscriptionStartDate : Time.Time;
    inviteCode : Text;
    createdAt : Time.Time;
    suspended : Bool;
  };

  type OldActor = {
    users : Map.Map<Principal, User>;
    inviteCodes : Map.Map<Text, { code : Text; created : Time.Time; used : Bool }>;
  };

  type NewActor = {
    users : Map.Map<Principal, User>;
    inviteCodes : Map.Map<Text, { code : Text; created : Time.Time; used : Bool }>;
  };

  public func run(old : OldActor) : NewActor {
    let cleanedUsers = old.users.filter(
      func(key, _user) {
        not key.isAnonymous();
      }
    );

    let finalInviteCodes = old.inviteCodes.map<Text, { code : Text; created : Time.Time; used : Bool }, { code : Text; created : Time.Time; used : Bool }>(
      func(k, v) { v }
    );

    let defaultCodes = [
      "VEIL-001",
      "VEIL-002",
      "VEIL-003",
      "VEIL-004",
      "VEIL-005",
    ];

    for (code in defaultCodes.values()) {
      if (not finalInviteCodes.containsKey(code)) {
        let ic = {
          code;
          created = Time.now();
          used = false;
        };
        finalInviteCodes.add(code, ic);
      };
    };

    {
      users = cleanedUsers;
      inviteCodes = finalInviteCodes;
    };
  };
};
