const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
{
    username: {
      type: String,
      required: [true, "Please add the user name"],
    },
    email: {
        type: String,
        required: [true, "Please add the user Waterloo email address"],
        unique: [true, "Waterloo Email already exists"]
    },
    password: {
        type: String,
        required: [true, "Please add the user password"],
    },
    userStatus: {
        type: String,
        enum: ['member', 'admin'],
        required: [true, "Please add the user's status"],
        default: 'member'
    },
    hasPaid: {
        type: Boolean,
        required: [true, "Please add whether the user has paid or not"],
        default: false
    },
    watIAM: {
        type: String,
        required: [true, "Please add the user watIAM"],
        unique: [true, "watIAM already exists"]
    },
    faculty: {
        type: String,
        required: [true, "Please add the user faculty"],
        enum: ["Math", "Engineering", "Science", "Arts", "Health", "Environment"]
    },
    term: {
        type: String,
        required: [true, "Please add the user term"]
    },
    heardFromWhere: {
        type: String,
        required: [true, "Please add where the user heard about us from"],
        default: "",
    },
    paymentMethod: {
        type: String,
        enum: ["Cash", "Online", "MathSoc"],
        validate: {
            validator: (value) => {
                if (this.hasPaid && !value) {
                    return false;
                }
                return true;
            },
            message: "You need a payment method if a user has paid",
        },
    },
    paymentLocation: {
        type: String,
        validate: {
            validator: (value) => {
                if (this.hasPaid && !value) {
                    return false;
                }
                return true;
            },
            message: "You need a payment location if a user has paid",
        },
    },
    verifier: {
        type: String,
        validate: {
            validator: (value) => {
                if (this.hasPaid && !value) {
                    return false;
                }
                return true;
            },
            message: "You need a payment verifier if a user has paid",
        },
    },
    isEmailVerified: {
        type: Boolean,
        required: [true, "Please add if the user's email is verified"],
        default: false,
    },
    memberIdeas: {
        type: String
    },
    token: {
        hash: {
            type: String,
            default: "somehash"
        },
        expires: {
            type: Number,
            default: -1
        },
    }
},
{
    timestamps: true,
}
);

module.exports = mongoose.model("users", userSchema);