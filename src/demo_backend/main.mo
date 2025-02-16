import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

actor {

    type UserRecord = {
        principal: Text;
        chain: Text;
        balance : Nat;
    };
    
    let users = HashMap.HashMap<Text, UserRecord>(32, Text.equal, Text.hash);
    
    public shared({caller : Principal}) func inc() : async Principal {
        return caller;
    };

    /* old functions
    public func getusers() : async Text {

        let numusers = users.size();

        return Nat.toText(numusers);
    };

    public func storeid(proton_account : Text, principal_id : Text) : async Text {
        
        users.put(proton_account, principal_id);

        let numusers = users.size();

        return proton_account # " / " # principal_id # " (" # Nat.toText(numusers) # " users)";
    };

    public func getuser(name : Text) : async Text {

        let p_id = users.get(name);

        switch(p_id) {
            case(?existingEntry) {
                return existingEntry;
            };
            case(null) { 
                return name # " not found";
            };
        };
    }; */

    // new functions
    public func storeuser(proton_account : Text, principal_id : Text, achain : Text) : async Text {
        
        let userRecord : UserRecord = {principal = principal_id; chain = achain; balance = 0; };
        
        users.put(proton_account, userRecord);

        let numusers = users.size();

        return "Registered " # proton_account # " (" # Nat.toText(numusers) # " users)";
    };

    public func fetchuser(proton_account : Text) : async Text {

        let userRecord = users.get(proton_account);

        switch(userRecord) {
            case(?existingEntry) {
                return "IC: " # proton_account # " principal: " # existingEntry.principal # " chain: " # existingEntry.chain # ", balance: " # Nat.toText(existingEntry.balance);
            };
            case(null) { 
                return proton_account # " is not registered";
            };
        };
    };

    public func get_balance(proton_account : Text) : async Text {

        let userRecord = users.get(proton_account);

        switch(userRecord) {
            case(?existingEntry) {
                return Nat.toText(existingEntry.balance);
            };
            case(null) { 
                return "0";
            };
        };
    };

    public func getnumusers() : async Text {

        let numusers = users.size();

        return Nat.toText(numusers);
    };

    public func claim(proton_account : Text) : async Text {
        var claimAmount : Nat = 100;
        var oldBalance : Nat = 0;
        var newBalance : Nat = 0;

        let userRecord = users.get(proton_account);

        switch(userRecord) {
            case(?existingEntry) {
                oldBalance := existingEntry.balance;
                newBalance := oldBalance + claimAmount;
                let userRecord : UserRecord = {principal = existingEntry.principal; chain = existingEntry.chain; balance = newBalance; };        
                users.put(proton_account, userRecord);
            };
            case(null) { 
                return proton_account # " is not registered";
            };
        };

        return "claim successful, IC balance: " # Nat.toText(oldBalance) # " → " # Nat.toText(newBalance);
    };

    public func switchuser(proton_account : Text, newChain : Text) : async Text {
        
        let userRecord = users.get(proton_account);

        switch(userRecord) {
            case(?existingEntry) {
                let userRecord : UserRecord = {principal = existingEntry.principal; chain = newChain; balance = existingEntry.balance; };        
                users.put(proton_account, userRecord);
            };
            case(null) { 
                return proton_account # " is not registered";
            };
        };

        return "switched chain to " # newChain;
    };
};