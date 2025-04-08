const router = require("express").Router();

const {  CreateUsers, UpdateUsers, GetUserDetails } = require("../Services/users");

router.post("/create", async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "name and email are required" });
        }

        const user = new CreateUsers({ name, email });
        const result = await user.CreateUser();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.put("/update_user", async (req, res, next) => {  
    try {
        const { user_id, name, email } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: "user_id is required" });
        }

        const user = new UpdateUsers(user_id, { name, email });
        const result = await user.UpdateUser();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.get("/details", async (req, res, next) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ message: "user_id is required" });
        }

        const user = new GetUserDetails(user_id);
        const result = await user.GetUserDetails();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = { UserRouter: router };