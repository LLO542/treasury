"""
Treasury Project Architecture Diagram
Using https://diagrams.mingrammer.com/
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.programming.framework import React, Fastapi
from diagrams.programming.language import JavaScript, NodeJS
from diagrams.onprem.database import MongoDB
from diagrams.onprem.client import Users
from diagrams.generic.storage import Storage
from diagrams.generic.compute import Rack
from diagrams.onprem.network import Nginx

# Graph attributes for better layout
graph_attr = {
    "fontsize": "20",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
}

with Diagram(
    "Treasury - Full Stack Architecture",
    filename="treasury_architecture",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
):
    # Users
    users = Users("Users")
    admin = Users("Admin")

    # Frontend Cluster
    with Cluster("Frontend (React + Vite)"):
        with Cluster("Pages"):
            public_pages = React("Public Pages\n(Home, Works, Blogs)")
            auth_pages = React("Auth Pages\n(Login, Register)")
            admin_pages = React("Admin Pages\n(Dashboard, Create)")
        
        with Cluster("Core"):
            router = JavaScript("React Router")
            contexts = JavaScript("Context API\n(Auth, Theme)")
            axios_client = JavaScript("Axios Client\n(API + Interceptors)")

    # Backend Cluster
    with Cluster("Backend (Express.js)"):
        with Cluster("API Routes"):
            auth_routes = NodeJS("/api/auth\n(Login, Register, Logout)")
            work_routes = NodeJS("/api/works\n(CRUD Operations)")
            blog_routes = NodeJS("/api/blogs\n(CRUD Operations)")
            media_routes = NodeJS("/api/media\n(File Upload)")
        
        with Cluster("Middleware"):
            jwt_auth = Rack("JWT Auth\nMiddleware")
            rate_limit = Rack("Rate Limiter\nMiddleware")
        
        with Cluster("Controllers"):
            controllers = NodeJS("Controllers\n(auth, blog, work)")

    # Database
    with Cluster("Database"):
        mongodb = MongoDB("MongoDB")
        with Cluster("Models"):
            user_model = Storage("User")
            blog_model = Storage("Blog")
            work_model = Storage("Work")
            token_model = Storage("TokenBlacklist")

    # File Storage
    with Cluster("Storage"):
        uploads = Storage("Uploads\n(Media Files)")

    # Connections - Users to Frontend
    users >> Edge(color="darkgreen") >> public_pages
    users >> Edge(color="darkgreen") >> auth_pages
    admin >> Edge(color="red") >> admin_pages

    # Frontend internal connections
    public_pages >> router
    auth_pages >> router
    admin_pages >> router
    router >> contexts
    contexts >> axios_client

    # Frontend to Backend
    axios_client >> Edge(label="HTTP/REST", color="blue") >> auth_routes
    axios_client >> Edge(color="blue") >> work_routes
    axios_client >> Edge(color="blue") >> blog_routes
    axios_client >> Edge(color="blue") >> media_routes

    # Backend internal connections
    auth_routes >> rate_limit >> jwt_auth >> controllers
    work_routes >> jwt_auth >> controllers
    blog_routes >> jwt_auth >> controllers
    media_routes >> jwt_auth >> controllers

    # Controllers to Database
    controllers >> Edge(label="Mongoose", color="green") >> mongodb
    mongodb - user_model
    mongodb - blog_model
    mongodb - work_model
    mongodb - token_model

    # Media routes to storage
    media_routes >> Edge(label="Multer", color="orange") >> uploads

print("Diagram generated: treasury_architecture.png")
