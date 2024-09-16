const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
{
    username: {
      type: String,
      required: [true, "Please add the user name"],
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
    },
    memberIdeas: {
        type: String
    },
    isIncomplete: {
        type: Boolean,
        default: false,
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

module.exports = mongoose.model("members", userSchema);