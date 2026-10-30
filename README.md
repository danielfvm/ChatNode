# Chat-Node
A fully decentralized peer to peer open source chat app.

## GIF search

GIF search uses the Tenor API v2. Create a Tenor API key, copy [.env.example](./.env.example) to `.env`, and set `VITE_TENOR_API_KEY` to your key before starting the development server or building the static app. Restrict this browser-visible key to the Tenor API and your deployed site in your Google Cloud project. GIF search displays an in-app error when the key is missing or the API request fails.

## Chat features

Messages support Markdown formatting, and files can be attached with the plus button or by dropping them into the composer. Attachments are shared directly with connected peers; up to 10 files and 5 MB total are allowed per message.

## Deploy to GitHub Pages

The `master` branch is deployed automatically by [the GitHub Actions workflow](./.github/workflows/deploy.yml). For this repository, the site is published at `https://danielfvm.github.io/ChatNode/`.

To enable GIF search on the deployed site, add a repository Actions variable named `VITE_TENOR_API_KEY` under **Settings → Secrets and variables → Actions → Variables**. This key is included in the browser bundle, so restrict it to the Tenor API and the deployed site; do not use a privileged or private credential. Without this optional variable, chat and file sharing still work, but GIF search reports that a key is required.
