import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  type InviteCode = {
    code : Text;
    created : Time.Time;
    used : Bool;
  };

  type ActorState = {
    inviteCodes : Map.Map<Text, InviteCode>;
  };

  let staticCodes : [Text] = [
    "VEIL-001",
    "VEIL-002",
    "VEIL-003",
    "VEIL-004",
    "VEIL-005",
  ];

  public func run(old : ActorState) : ActorState {
    // Ensure each static VEIL code is present; preserve existing used state if already present
    for (code in staticCodes.vals()) {
      switch (old.inviteCodes.get(code)) {
        case (null) {
          let ic : InviteCode = {
            code;
            created = 0;
            used = false;
          };
          old.inviteCodes.add(code, ic);
        };
        case (?_) {
          // Already present, preserve existing state (may be used or unused)
        };
      };
    };
    { old with inviteCodes = old.inviteCodes };
  };
};
