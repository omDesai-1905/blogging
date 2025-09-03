import mongoose from 'mongoose';

const blogTopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description : {
        type: String,
        required: true,
        trim: true
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });

const Topic = mongoose.model("Topic", blogTopicSchema)
export default Topic;