import express from 'express'
import { 
    verifyJWT,
    getLoggedInUserOrIgnore
 } from '../middleware/auth.middleware.js'
import {
    getUserProfile,
    getUserPost
} from '../controller/user.controller.js'
const router = express.Router()

router.route("/:userName").get(getLoggedInUserOrIgnore, getUserProfile)
router.route("/:userName/posts").get(getUserPost)

export default router;