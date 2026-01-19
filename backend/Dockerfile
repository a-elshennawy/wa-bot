FROM node:18
RUN apt-get update && apt-get install -y python3 python3-pip chromium
WORKDIR /app
COPY package*.json ./
RUN npm install
# We force the latest versions to prevent the Signature error
RUN pip3 install --upgrade gspread oauth2client --break-system-packages
COPY . .
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
CMD ["node", "bot.js"]
