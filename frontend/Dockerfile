# 1. Use the ultra-lightweight Nginx Alpine image
FROM nginx:alpine

# 2. Set the working directory to where Nginx serves files
WORKDIR /usr/share/nginx/html

# 3. Remove the default Nginx static files
RUN rm -rf ./*

# 4. Copy the 'dist' folder from your laptop into the container
# Note: This assumes the 'dist' folder is in the same directory as this Dockerfile
COPY ./dist .

# 5. Expose Port 80 (Standard for Nginx)
EXPOSE 80

# 6. Start Nginx
CMD ["nginx", "-g", "daemon off;"]