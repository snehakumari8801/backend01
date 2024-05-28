import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); //userid find
    const accessToken = user.generateAccessToken(); //generate accessToken
    const refreshToken = user.generateRefreshToken(); //generate refreshToken

    user.refreshToken = refreshToken; //refreshToken ko database me save
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken }; // return
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from frontend
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  // validation - not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field is required");
  }

  // check if user alredy exist - username ,email
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  //console.log(existUser)

  if (existUser) {
    return new ApiError(409, "user with username , and email is alredy exist");
  }
  console.log(req.files);

  // check images , check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    return new ApiError(400, "Avatar file is required");
  }

  // upload them to cloudinary , avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return new ApiError(400, "Avatar file is required");
  }

  // create user object - create entery in db
  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //coverImage hai toh uska url le loh varna empty
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response  (it done in cloudinary using unlink)

  // check for user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body - data
  const { username, email, password } = req.body;

  // username or email
  if (!username || !email) {
    throw new ApiError(400, "username or password is required");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // send cookie
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse( // response
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user loggedIn successfully"
      )
    );
});

export { registerUser, loginUser };
