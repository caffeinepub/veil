import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldUser = {
    id : Principal.Principal;
    pseudonym : Text;
    region : { #India; #Global };
    subscriptionStatus : { #grace; #active; #expired };
    createdAt : Time.Time;
    suspended : Bool;
    hasAcknowledgedEntryMessage : Bool;
    hasAcknowledgedPublicPostMessage : Bool;
  };

  type OldActor = {
    users : Map.Map<Principal.Principal, OldUser>;
  };

  type NewUser = OldUser;

  type NewActor = {
    users : Map.Map<Principal.Principal, NewUser>;
  };

  public func run(old : OldActor) : NewActor {
    { users = old.users };
  };
};
