const UserSchema = new mongoose.Schema({
	name: String,
	email: { type: String, unique: true },
	phone: String,
});

const User =
	mongoose.models.User || mongoose.model("User", userSchema);

export default User