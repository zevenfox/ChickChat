const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const StreamChat = require('stream-chat').StreamChat;
const crypto = require('crypto');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const serverClient = connect(api_key, api_secret, app_id);

const login = async (req, res) => {
    try {
        const { fullName, username, password, phoneNumber } = req.body;

        const userId = crypto.randomBytes(16).toString('hex');

        const client = StreamChat.getInstance(api_key, api_secret);
        const hashedPassword = await bcrypt.hash(password.toString(), 10);
        
        const token = client.createToken(userId);

        res.status(200).json({ token, fullName, username, userId, hashedPassword, phoneNumber });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: error});
    }
};


const signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        const client = StreamChat.getInstance(api_key, api_secret);
        const token = client.createToken(username);

        await client.connectUser({ id: username }, token);

        const { users } = await client.queryUsers({ id: username });

        if(!users.length) return res.status(400).json({ message: 'User not found' });

        const success = await bcrypt.compare(password, users[0].hashedPassword);

        if(success) {
            res.status(200).json({ token, fullName: users[0].fullName, username, userId: users[0].id });
        } else {
            res.status(500).json({ message: 'Incorrect Password' });
        }

        await client.disconnect();
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: error});
    }
};


module.exports = { signup, login };
