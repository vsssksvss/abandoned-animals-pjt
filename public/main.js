// public/main.js
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const token = () => localStorage.getItem('token');
    const email = () => localStorage.getItem('email');
  
    function setUser() {
      $('user-info').innerText = email() ? `👤 ${email()}` : '';
    }
  
    // 입양동물 보기
    $('btn-animals').onclick = async () => {
      try {
        const res = await fetch('/animals/api');
        if (!res.ok) throw new Error('동물 데이터 호출 실패');
        const animals = await res.json();
        $('content').innerHTML = `
          <h2>입양 동물</h2>
          <div class="grid">
            ${animals.map(a => `
              <div class="card">
                <img src="${a.image_url}" alt="동물 사진" />
                <h3>${a.name} (${a.gender})</h3>
                <p>${a.breed}</p>
                <p>${a.location}</p>
              </div>
            `).join('')}
          </div>
        `;
      } catch (e) {
        alert(e.message);
      }
    };
  
    // 게시판: 좌측은 게시글 목록, 우측은 상세보기 및 댓글 작성 영역
    $('btn-board').onclick = async () => {
      try {
        const res = await fetch('/articles');
        if (!res.ok) throw new Error('게시물 불러오기 실패');
        const data = await res.json();
        const articles = data.articles;
        let html = `
          <div id="board-container" style="display: flex;">
            <div id="article-list" style="flex: 1; padding-right: 20px; border-right: 1px solid #ccc;">
              <h2>게시판</h2>
              <ul>`;
        if (articles.length === 0) {
          html += `<li>게시글이 없습니다.</li>`;
        } else {
          html += articles.map(a => `
            <li style="margin-bottom: 10px;">
              <strong style="cursor: pointer;" onclick="loadArticle(${a.id})">${a.title}</strong>
              <p>${a.content.substring(0, 50)}...</p>
            </li>
          `).join('');
        }
        html += `
              </ul>
              <h3>글 작성</h3>
              <form id="post-form">
                <input name="title" placeholder="제목" required /><br/>
                <textarea name="content" placeholder="내용" required></textarea><br/>
                <button type="submit">작성</button>
              </form>
            </div>
            <div id="article-detail" style="flex: 1; padding-left: 20px;">
              <h2>게시글 상세</h2>
              <div id="article-content">
                <p>목록에서 게시글을 선택하세요.</p>
              </div>
              <div id="comment-section" style="margin-top: 20px;">
                <!-- 댓글 영역 -->
              </div>
            </div>
          </div>
        `;
        $('content').innerHTML = html;
  
        if ($('post-form')) {
          $('post-form').onsubmit = async e => {
            e.preventDefault();
            const f = e.target;
            try {
              const res = await fetch('/api/articles', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token()
                },
                body: JSON.stringify({
                  title: f.title.value,
                  content: f.content.value
                })
              });
              if (!res.ok) throw new Error('게시글 작성 실패');
              // 새 글 작성 후 다시 게시판 버튼 클릭하여 목록 갱신
              $('btn-board').click();
            } catch(err) {
              alert(err.message);
            }
          };
        }
      } catch (e) {
        alert(e.message);
      }
    };
  
    // 전역 함수로 게시글 상세 및 댓글 로드
    window.loadArticle = async (articleId) => {
      try {
        // 상세 게시글 불러오기 (단순화를 위해 전체 목록에서 찾습니다)
        const res = await fetch('/articles');
        if (!res.ok) throw new Error('게시글 불러오기 실패');
        const data = await res.json();
        const article = data.articles.find(a => a.id === articleId);
        if (!article) {
          alert('게시글을 찾을 수 없습니다.');
          return;
        }
        let detailHtml = `
          <h3>${article.title}</h3>
          <p>${article.content}</p>
        `;
  
        // 댓글 목록 불러오기 (GET /articles/comments/:articleId)
        const cRes = await fetch(`/articles/comments/${articleId}`);
        if (cRes.ok) {
          const commentData = await cRes.json();
          detailHtml += `<h4>댓글</h4><ul>`;
          if (commentData.comments && commentData.comments.length > 0) {
            detailHtml += commentData.comments.map(c => `<li>${c.content}</li>`).join('');
          } else {
            detailHtml += `<li>댓글이 없습니다.</li>`;
          }
          detailHtml += `</ul>`;
        } else {
          detailHtml += `<p>댓글 불러오기 실패</p>`;
        }
  
        // 댓글 작성 폼
        detailHtml += `
          <h4>댓글 작성</h4>
          <form id="comment-form">
            <textarea name="content" placeholder="댓글 입력" required></textarea><br/>
            <button type="submit">댓글 작성</button>
          </form>
        `;
  
        $('article-content').innerHTML = detailHtml;
  
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
          commentForm.onsubmit = async e => {
            e.preventDefault();
            const f = e.target;
            try {
              const res = await fetch(`/articles/comments/${articleId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token()
                },
                body: JSON.stringify({ content: f.content.value })
              });
              if (!res.ok) throw new Error('댓글 작성 실패');
              loadArticle(articleId);
            } catch(err) {
              alert(err.message);
            }
          };
        }
      } catch (err) {
        alert(err.message);
      }
    };
  
    // 로그인 / 회원가입 이벤트는 기존과 동일
    $('btn-login').onclick = () => {
      $('content').innerHTML = `
        <h2>로그인</h2>
        <form id="login-form">
          <input name="email" type="email" required /><br/>
          <input name="password" type="password" required /><br/>
          <button type="submit">로그인</button>
        </form>
      `;
      document.getElementById('login-form').onsubmit = async e => {
        e.preventDefault();
        const f = e.target;
        try {
          const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: f.email.value,
              password: f.password.value
            })
          });
          const result = await res.json();
          if (res.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('email', f.email.value);
            setUser();
            $('btn-board').click();
          } else {
            alert(result.message);
          }
        } catch (error) {
          alert('로그인 도중 오류 발생');
        }
      };
    };
  
    $('btn-signup').onclick = () => {
      $('content').innerHTML = `
        <h2>회원가입</h2>
        <form id="signup-form">
          <input name="email" type="email" required /><br/>
          <input name="password" type="password" required /><br/>
          <button type="submit">회원가입</button>
        </form>
      `;
      document.getElementById('signup-form').onsubmit = async e => {
        e.preventDefault();
        const f = e.target;
        try {
          const res = await fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: f.email.value,
              password: f.password.value
            })
          });
          if (res.ok) {
            alert('회원가입 완료!');
            $('btn-login').click();
          } else {
            const result = await res.json();
            alert(result.message);
          }
        } catch (error) {
          alert('회원가입 도중 오류 발생');
        }
      };
    };
  
    setUser();
  });
  