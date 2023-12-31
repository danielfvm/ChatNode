// update profile
// have multiple peers in url

import defaultProfilePicture from '$lib/images/profile.png';

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
        this.profile = {
            picture: defaultProfilePicture,
            name: 'None',
            pronouns: 'they/them',
            bio: 'No bio yet',
            loaded: false,
        };
        this.chat = chat;
        this.conn = conn;

        // Remove user if not connected after 10 second
        this.resetKeepAliveTimeout();

        this.conn.on('open', () => {
            console.log('Now connected to: ' + this.conn.peer);
            this.conn.on('data', (data) => this.handleData(data));

            setTimeout(() => {
                onOpen();
                this.sendData({type: 'profile', profile: this.chat.profile, chat: chat.name});
                console.log('Send profile after 500ms');
            }, 500);
        });

        this.conn.on('close', () => console.log("!close") || this.chat.removeUser(this));
        this.conn.on('error', (e) => console.log("!error") || this.chat.removeUser(this));
    }

    keepAliveTimeout() {
        console.error("Keep alive timeout");
        this.chat.removeUser(this);
        this.chat.onUserChange(this);
    }

    resetKeepAliveTimeout() {
        if (this._keepAliveTimeout)
            clearTimeout(this._keepAliveTimeout);
        this._keepAliveTimeout = setTimeout(this.keepAliveTimeout.bind(this), 10000);
    }

    sendData(data) {
        this.conn.send(JSON.stringify(data));
    }

    handleData(data) {
        const message = tryParse(data);

        if (message == null)
            return;

        switch (message.type) {
            case 'profile':
                if (this.chat.name != message.chat) {
                    this.chat.removeUser(this);
                    this.chat.onUserChange(this);
                } else if (this.profile != message.profile) {
                    this.profile.picture = message.profile.picture || defaultProfilePicture;
                    this.profile.picture = this.profile.picture.length > 1024 * 512 ? defaultProfilePicture : this.profile.picture; // if image to large, fallback to default
                    this.profile.name = (message.profile.name || this.profile.name).substring(0, 20);
                    this.profile.pronouns = (message.profile.pronouns || this.profile.pronouns).substring(0, 20);
                    this.profile.bio = (message.profile.bio || this.profile.bio).substring(0, 256);
                    this.profile.loaded = true;

                    this.chat.onUserChange(this);
                }
                break;

            // other users that the user is connected to
            case 'add_peers':
                for (const peerId of (message.peers || []))
                    this.chat.addUser(new User(this.chat, this.chat.peer.connect(peerId)));
                break;

            case 'get_peers':
                this.sendData({type: 'add_peers', peers: this.chat.users.filter(u => u != this).map(u => u.conn.peer)});
                break;

            case 'message':
                this.chat.writeMessage(new MessageData(message.data || "", this));
                break;

            case 'ping':
                this.resetKeepAliveTimeout();
                break;
                
        }
    }

    closeConnection() {
        this.conn.close();
    }

    isConnected() {
        return this.profile && this.profile.loaded && this.conn && this.conn._open;
    }
}

export class MessageData {
    constructor(data, user) {
        this.time = new Date();
        this.user = user;
        this.data = data;
    }

    set data(data) {
        this._data = data.trim().substring(0, 1024 * 1024);

        // extract tenor urls
        this._gifs = this._data.match(/(https?:\/\/media.tenor.com\/[^\s]+)/g) || [];
        this._text = this._data.replace(/(https?:\/\/media.tenor.com\/[^\s]+)/g, '');

        this._pngs = this._text.match(/(data:image\/png;base64,[^\s]+)/g) || [];
        this._text = this._text.replace(/(data:image\/png;base64,[^\s]+)/g, '');


        // extract program enclosers indicated with ```prog code ```
        this._prog = (this._text.match(/(\`\`\`prog[\s\S]+?\`\`\`)/g) || [])[0];
        this._text = this._text.replace(/(\`\`\`prog[\s\S]+?\`\`\`)/g, '');

        if (this._prog) {
            this._prog = this._prog.substring(7, this._prog.length - 3);
        }
    }

    get data() {
        return this._data;
    }

    get text() {
        return this._text;
    }

    get gifs() {
        return this._gifs;
    }

    get pngs() {
        return this._pngs;
    }

    get program() {
        return this._prog;
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
        this.onUserChange = (_user) => {};

        this.peer = new Peer();
        this.peer.on('open', (id) => {
            console.log("Your peer id: " + id);
            this.peerId = id;

            this.onOpen();
            this.onUserChange(null);
        });

        this.peer.on('close', () => {
            console.log('Disconnected');
        });

        this.peer.on('error', (_) => {
            console.log("Error");
        });

        this.peer.on('connection', (conn) => {
            console.log("Connection from: " + conn.peer);
            this.addUser(new User(this, conn));
        });

        this.keepAliveInterval = setInterval(() => {
            this.broadcast({type: 'ping'});
        }, 5000);
    }

    // Add user to chat except if they are already in the list
    addUser(user) {
        if (!this.users.find(u => u.conn.peer == user.conn.peer))
            this.users.push(user);

        console.log("add", this.users.map(u => u.conn.peer));
    }

    writeMessage(msg) {
        this.messages.push(msg);
        this.onMessage(msg);
        if (this.profile == msg.profile) {
            this.users.forEach(user => user.sendData({type: 'message', data: msg.data}));
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
        console.log("rem", idx, this.users.map(u => u.conn.peer));
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
        window.history.replaceState(null, 'Title', '?chat=' + this.getLink());
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
        clearTimeout(this.keepAliveInterval);
    }
}
