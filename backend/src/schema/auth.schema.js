import Yup from "yup";

export const registerSchema = Yup.object().shape({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  userName: Yup.string().lowercase().required(),
  password: Yup.string().min(7).required(),
  gender: Yup.string().oneOf(["male", "female", "other"]).optional(),
});

export const loginSchema = Yup.object()
  .shape({
    userName: Yup.string(),
    email: Yup.string().email("Invalid email format"),
    emailOrUsername: Yup.string(),
    password: Yup.string().required("Password is required"),
  })
  .test(
    "at-least one",
    "Either userName, email, or emailOrUsername required",

    function (value) {
      return value.userName || value.email || value.emailOrUsername;
    },
  );

export const changePasswordSchema = Yup.object().shape({
  newPassword: Yup.string().min(7).required("new password is required."),
  oldPassword: Yup.string().required("old passwor is required."),
});

export const updateUserSchema = Yup.object().shape({
  name: Yup.string(),
  email: Yup.string().email(),
  userName: Yup.string().lowercase(),
  gender: Yup.string(),
});
