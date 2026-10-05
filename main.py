from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class Post(BaseModel):
    id: int | None = None
    title: str
    content: str
    user_id: str
    created_at: datetime | None = None

class Update_post(BaseModel):
    title: str
    content: str
    user_id: str

posts: list[Post] = []

@app.get("/hello")
def read_root():
    return {"message": "HELLO BS !"}

# 게시글 생성
@app.post("/posts")
def create_post(post: Post):
    post.id = len(posts) + 1
    post.created_at = datetime.now()
    posts.append(post)
    return post

# 게시글 전체 조회 (id, title))
@app.get("/posts")
def read_posts():
    result = []
    for p in posts:
        result.append({"id": p.id, "title": p.title})
    return result

# 게시글 상세 조회, 특정 id 게시글 
# id, title, content, userid, date 정보 출력

@app.get("/posts/{post_id}")
def read_post(post_id : int):
    for post in posts:
        if post.id == post_id:
            return post
    return ("게시글이 없음")

# 게시글 수정
# 특정 게시글 id 필요, 
@app.put("/posts/{post_id}")
def update_post(post_id : int, updated : Update_post):
    for post in posts:
        if post.id == post_id:
            post.title = updated.title
            post.content = updated.content
            post.user_id = updated.user_id
            return post
    return ("게시글이 없음")

# 게시글 삭제
# 게시글 id 받아서 삭제
@app.delete("/posts/{post_id}")
def delete_post(post_id : int):
    for post in posts:
        if post.id == post_id:
            posts.remove(post)
            return("게시글이 삭제됨")
    return("해당 게시글 없음")