const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
{
    username: {
      type: String,
      required: [true, "Please add the user name"],
    },
    email: {
      type: String,
      required: [true, "Please add the user email address"],
      unique: [true, "Email address already taken"],
    },
    uwEmail: {
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
        default: 'member',
    },
    hasPaid: {
        type: Boolean,
        required: [true, "Please add the user payment status"],
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
    },
    paymentLocation: {
        type: String,
    },
    verifier: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
        requied: [true, "Please provide an email verfication status"]
    },
    memberIdeas: {
        type: String
    },
    isIncomplete: {
        type: Boolean,
        default: false,
        required: [true, "Please provide a completeness value"]
    },
    token: {
        hash: {
            type: String,
            required: [true, "Please provide the hash value"],
            default: "somehash"
        },
        expires: {
            type: Number,
            required: [true, "Please provide the expiry date"],
            default: -1
        },
    }
},
{
    timestamps: true,
}
);

module.exports = mongoose.model("User", userSchema);