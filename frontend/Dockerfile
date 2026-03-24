# 1. Use a lightweight Node.js environment
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy only the package files first (this is a DevOps trick to make builds faster)
COPY package*.json ./

# 4. Install the frontend dependencies
RUN npm install

# 5. Copy the rest of your React code into the container
COPY . .

# 6. Expose the port Vite uses
EXPOSE 5173

# 7. Start the Vite server and expose it to the network
CMD ["npm", "run", "dev", "--", "--host"]