// update profile
// have multiple peers in url

export function tryParse(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

export function stripHtml(html) {
    let tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

export class User {
    constructor(chat, conn, onOpen = () => {}) {
        this.profile = null;
        this.chat = chat;
        this.conn = conn;

        // Remove user if not connected after 1 second
        setTimeout(() => {
            if (!this.isConnected()) {
                this.chat.removeUser(this);
            }
        }, 1000);

        this.conn.on('open', () => {
            console.log('Now open!');
            this.conn.on('data', (data) => this.handleData(data));

            setTimeout(() => {
                onOpen();
                this.sendData({type: 'profile', profile: this.chat.profile, chat: chat.name});
            }, 100);
        });

        this.conn.on('close', () => console.log("!close") || this.chat.removeUser(this));
        this.conn.on('error', (_) => console.log("!error") || this.chat.removeUser(this));
    }

    sendData(data) {
        this.conn.send(JSON.stringify(data));
    }

    handleData(data) {
        const message = tryParse(data);
        console.log("data", message);
        if (message == null)
            return;

        switch (message.type) {
            case 'profile':
                if (this.chat.name != message.chat) {
                    this.chat.removeUser(this);
                } else if (this.profile != message.profile) {
                    this.profile = message.profile;
                    this.chat.onUserJoined(this);
                }
                break;

            // other users that the user is connected to
            case 'add_peers':
                for (const peerId of message.peers)
                    this.chat.addUser(new User(this.chat, this.chat.peer.connect(peerId)));
                break;

            case 'get_peers':
                console.log("peeeeer", this.chat.users.length)
                this.sendData({type: 'add_peers', peers: this.chat.users.filter(u => u != this).map(u => u.conn.peer)});
                break;

            case 'message':
                this.chat.writeMessage(new MessageData(message.text, this));
                break;
        }
    }

    closeConnection() {
        this.conn.close();
    }

    isConnected() {
        return this.profile && this.conn && this.conn._open;
    }
}

export class MessageData {
    constructor(text, user) {
        this.time = new Date();
        this.text = text.trim();
        this.user = user;
    }

    get profile() {
        return this.user.profile;
    }
}

export class Chat {
    constructor(profile, name) {
        this.profile = profile;
        this.name = name;
        this.users = [];
        this.messages = [];
        this.peerId = null;
        this.onOpen = () => {};
        this.onMessage = (_msg) => {};
        this.onUserJoined = (_user) => {};

        this.peer = new Peer();
        this.peer.on('open', (id) => {
            console.log(id);
            this.peerId = id;

            this.onOpen();
            this.onUserJoined(null);
        });

        this.peer.on('close', () => {
            console.log('Disconnected');
        });

        this.peer.on('error', (e) => {
            console.log('Error');
        });

        this.peer.on('connection', (conn) => {
            console.log("connection!");
            this.addUser(new User(this, conn));
        });
    }

    // Add user to chat except if they are already in the list
    addUser(user) {
        if (!this.users.find(u => u.conn.peer == user.conn.peer))
            this.users.push(user);

        console.log("add", this.users);
    }

    writeMessage(msg) {
        console.log("write message: ", msg.text, " ", msg.profile.name);
        this.messages.push(msg);
        this.onMessage(msg);
        if (this.profile == msg.profile) {
            this.users.forEach(user => user.sendData({type: 'message', text: msg.text}));
            console.log("send to " + this.users.length);
        }
    }

    // Remove user and close connection 
    removeUser(user) {
        const idx = this.users.indexOf(user);
        if (idx != -1) {
            this.users[idx].closeConnection();
            this.users.splice(idx, 1);
        }
        console.log("rem", idx, this.users);
    }

    // Send a message to everyone except the defined user in exclude
    broadcast(data, exclude = null) {
        this.users.filter(user => user != exclude).forEach(user => user.sendData(data));
    }

    updateProfile(profile) {
        this.profile = profile;
        this.users.forEach(user => user.sendData({type: 'profile', profile: profile, chat: this.name}));
    }

    getLink() {
        let peers = [this.peerId];
        if (this.users.length > 0) {
            peers.push(...this.users.map(u => u.conn.peer));
            peers = peers.slice(0, 2).join(':');
        }

        return btoa(this.name + ':' + peers + ':');
    }

    refreshTitle() {
        window.history.pushState(null, 'Title', '?chat=' + this.getLink());
    }

    // Creates a new chat with a random name
    static createChat(profile) {
        console.log("Create chat");
        return new Chat(profile, Math.random().toString(36).substring(2, 8));
    }

    // Join a chat using it's name and peerId
    static joinChat(profile, chatId, peers = []) {
        const chat = new Chat(profile, chatId);
        chat.onOpen = () => {
            for (const peerId of peers) {
                const conn = chat.peer.connect(peerId, {reliable: true});
                if (conn) {
                    const user = new User(chat, conn, () => {
                        // send data
                        user.sendData({type: 'get_peers'});
                    });

                    chat.addUser(user);
                }
            }
        }

        return chat;
    }

    close() {
        console.log(this.peer);
        this.peer.disconnect();
    }
}
