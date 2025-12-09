FROM node:18-alpine

WORKDIR /app

# Copy package metadata
COPY package*.json ./

# Reuse node_modules installed on the host
COPY node_modules ./node_modules

# Copy the rest of the backend code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
