import Yup from "yup";

export const createBlogAndPostSchema = Yup.object().shape({
  title: Yup.string().required(),
  content: Yup.string().required(),
  slug: Yup.string().required(),
});