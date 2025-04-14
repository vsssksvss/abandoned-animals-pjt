document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const token = () => localStorage.getItem('token');
  const currentUserEmail = () => localStorage.getItem('email');
    // 디버깅 로그 추가
    console.log("main.js loaded, DOMContentLoaded 이벤트 발생");

  /* 사용자 정보 설정: 오른쪽 상단에 내 이메일 표시 및 로그아웃 버튼 제어 */
  function setUser() {
    const emailVal = currentUserEmail();
    const userInfo = $('user-info');
    const logoutBtn = $('logout-btn');
    if (emailVal && token()) {
      userInfo.innerText = `👤 ${emailVal}`;
      logoutBtn.style.display = 'inline-block';
    } else {
      userInfo.innerText = '';
      logoutBtn.style.display = 'none';
    }
  }
  
  $('logout-btn').onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser();
    $('content').innerHTML = '<p>로그아웃되었습니다.</p>';
  };
  
    
      // 동물 보기 버튼 이벤트 핸들러 등록
      const animalBtn = $('btn-animals');
      if (!animalBtn) {
        console.error("동물 보기 버튼(btn-animals)이 존재하지 않습니다.");
      } else {
        animalBtn.addEventListener('click', async () => {
          console.log("동물 보기 버튼 클릭됨");
          try {
            const res = await fetch('/petfinder/animals');
            console.log("fetch 요청 후, 상태:", res.status);
            if (!res.ok) throw new Error('동물 데이터 호출 실패: ' + res.statusText);
            const data = await res.json();
            console.log("API 응답 데이터:", data);
    
            if (!data.animals || !Array.isArray(data.animals)) {
              throw new Error('동물 데이터 형식 오류');
            }
            renderPetfinderAnimals(data.animals);
          } catch (error) {
            console.error("동물 보기 기능 에러:", error);
            alert(error.message);
          }
        });
      }
    
      // Petfinder 동물 카드 렌더링 함수
      function renderPetfinderAnimals(animals) {
        let html = `<h2>입양 가능한 반려동물</h2>`;
        html += `<div class="grid">`;
        animals.forEach(animal => {
          html += `
            <div class="card pet-card" data-animal-id="${animal.id}">
              <img src="${animal.primary_photo_cropped?.small || 'default_image.jpg'}" alt="${animal.name || '동물 사진'}">
              <h3>${animal.name || '정보없음'}</h3>
              <p>품종: ${animal.breeds?.primary || '정보없음'}</p>
              <p>위치: ${animal.contact?.address?.postcode || '정보없음'}</p>
            </div>
          `;
        });
        html += `</div>`;
        $('content').innerHTML = html;
    
        // 카드 클릭 이벤트: 상세 정보 모달 표시
        document.querySelectorAll('.pet-card').forEach(card => {
          card.addEventListener('click', () => {
            const animalId = card.getAttribute('data-animal-id');
            const animal = animals.find(a => String(a.id) === animalId);
            if (animal) {
              showPetfinderAnimalDetail(animal);
            } else {
              console.error("선택된 동물 정보를 찾지 못했습니다: animalId =", animalId);
            }
          });
        });
      }
    
      // Petfinder 동물 상세 정보 모달 표시 함수
      function showPetfinderAnimalDetail(animal) {
        const detailHTML = `
          <div class="modal">
            <button id="close-detail" class="close-btn">&times; 닫기</button>
            <img src="${animal.primary_photo_cropped?.medium || 'default_image.jpg'}" alt="${animal.name || '동물 사진'}">
            <h2>${animal.name || '정보없음'}</h2>
            <p><strong>성별:</strong> ${animal.gender || '정보없음'}</p>
            <p><strong>품종:</strong> ${animal.breeds?.primary || '정보없음'}</p>
            <p><strong>나이:</strong> ${animal.age || '정보없음'}</p>
            <p><strong>위치:</strong> ${animal.contact?.address?.postcode || '정보없음'}</p>
          </div>
        `;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = detailHTML;
        document.body.appendChild(overlay);
        document.getElementById('close-detail').addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
      }
  

  /* 게시판 기능: 게시판 버튼 클릭 시 게시글 목록 및 댓글을 불러옴 */
  $('btn-board').onclick = async () => {
    try {
      const res = await fetch('/articles');
      if (!res.ok) throw new Error('게시글 불러오기 실패: ' + res.statusText);
      const data = await res.json();
      const articles = data.articles;
      renderBoard(articles);
    } catch (e) {
      alert(e.message);
    }
  };

  function renderBoard(articles) {
    let boardHTML = `<h2>게시판</h2>`;
    if (articles.length === 0) {
      boardHTML += `<p>게시글이 없습니다.</p>`;
    } else {
      articles.forEach(article => {
        boardHTML += `
          <div class="article-box" data-article-id="${article.id}">
            <div class="article-header">
              <h3 class="article-title" style="cursor:pointer;">${article.title}</h3>
              <div class="article-meta" style="font-size:0.8rem; color:#666;">
                작성자: ${article.user_email || '익명'} | ${article.created_at || ''}
              </div>
              ${
                (currentUserEmail() && article.user_email && currentUserEmail() === article.user_email)
                ? `<div class="article-actions">
                     <button class="btn-edit-article" data-article-id="${article.id}" style="background-color:#003d7a; color:#fff;">수정</button>
                     <button class="btn-delete-article" data-article-id="${article.id}" style="background-color:crimson; color:#fff;">삭제</button>
                   </div>`
                : ''
              }
            </div>
            <div class="article-content" style="margin-top:10px;">
              <p>${article.content}</p>
            </div>
            <!-- 댓글 섹션 -->
            <div class="comments-container" data-loaded="0" id="comments-${article.id}">
              <button class="btn-show-comments" data-article-id="${article.id}">댓글 보기</button>
              <div class="comments-section" style="display:none; margin-top:10px;">
                <ul class="comments-list"></ul>
                <a href="javascript:void(0);" class="btn-more-comments" data-article-id="${article.id}" style="display: none;">↓더보기</a>
                <form class="comment-form" data-article-id="${article.id}" style="margin-top:10px;">
                  <textarea name="content" placeholder="댓글 작성" required></textarea><br/>
                  <button type="submit" style="background-color: crimson; color: white;">댓글 작성</button>
                </form>
              </div>
            </div>
          </div>
          <hr style="margin:20px 0;">
        `;
      });
    }
    if (token()) {
      boardHTML += `
        <h3>새 글 작성</h3>
        <form id="post-form" class="form-container">
          <input name="title" placeholder="제목" required>
          <textarea name="content" placeholder="내용" required></textarea>
          <button type="submit">작성</button>
        </form>
      `;
    }
    $('content').innerHTML = boardHTML;

    // 게시글 작성 폼 이벤트 등록
    const postForm = document.getElementById('post-form');
    if (postForm) {
      postForm.onsubmit = async e => {
        e.preventDefault();
        const f = e.target;
        const res = await fetch('/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token()
          },
          body: JSON.stringify({ title: f.title.value, content: f.content.value })
        });
        if (!res.ok) return alert('게시글 작성 실패');
        alert('게시글이 작성되었습니다.');
        $('btn-board').click(); // 목록 갱신
      };
    }

    // 게시글 수정/삭제 이벤트 등록
    document.querySelectorAll('.btn-edit-article').forEach(btn => {
      btn.onclick = () => {
        const articleId = btn.getAttribute('data-article-id');
        loadArticleForEdit(articleId);
      };
    });
    document.querySelectorAll('.btn-delete-article').forEach(btn => {
      btn.onclick = async () => {
        const articleId = btn.getAttribute('data-article-id');
        if (confirm('게시물을 삭제하시겠습니까?')) {
          const res = await fetch(`/articles/${articleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token() }
          });
          if (!res.ok) return alert('게시물 삭제 실패');
          $('btn-board').click();
        }
      };
    });

    // 댓글 보기 토글 이벤트 등록
    document.querySelectorAll('.btn-show-comments').forEach(btn => {
      btn.onclick = () => {
        const articleId = btn.getAttribute('data-article-id');
        toggleCommentsDisplay(articleId);
      };
    });

    // 댓글 작성 이벤트 등록
    document.querySelectorAll('.comment-form').forEach(form => {
      form.onsubmit = async e => {
        e.preventDefault();
        const articleId = form.getAttribute('data-article-id');
        const content = form.content.value;
        const res = await fetch(`/articles/comments/${articleId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token()
          },
          body: JSON.stringify({ content })
        });
        if (!res.ok) return alert('댓글 작성 실패');
        // 서버가 실제 댓글 ID 등을 반환한다고 가정
        const result = await res.json();
        const newComment = {
          id: result.commentId,
          content,
          user_email: currentUserEmail(),
          created_at: new Date().toLocaleString()
        };
        appendNewComment(articleId, newComment);
        form.content.value = '';
      };
    });
  }

  async function loadArticleForEdit(articleId) {
    const res = await fetch('/articles');
    if (!res.ok) return alert('게시글 불러오기 실패');
    const data = await res.json();
    const article = data.articles.find(a => a.id === articleId);
    if (!article) return alert('게시글을 찾을 수 없습니다.');
    $('content').innerHTML = `
      <h2>게시글 수정</h2>
      <form id="edit-form" data-article-id="${article.id}" class="form-container">
        <input name="title" value="${article.title}" required>
        <textarea name="content" required>${article.content}</textarea>
        <button type="submit">수정</button>
      </form>
    `;
    const editForm = document.getElementById('edit-form');
    editForm.onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch(`/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token()
        },
        body: JSON.stringify({ title: f.title.value, content: f.content.value })
      });
      if (!res.ok) return alert('게시글 수정 실패');
      $('btn-board').click();
    };
  }

  function toggleCommentsDisplay(articleId) {
    const container = document.getElementById('comments-' + articleId);
    const section = container.querySelector('.comments-section');
    if (section.style.display === 'none' || section.style.display === '') {
      section.style.display = 'block';
      container.setAttribute('data-loaded', '0');
      loadComments(articleId, 0);
    } else {
      section.style.display = 'none';
    }
  }

  async function loadComments(articleId, startIndex = 0) {
    try {
      const cRes = await fetch(`/articles/comments/${articleId}`);
      if (!cRes.ok) {
        alert('댓글 불러오기 실패');
        return;
      }
      const comments = await cRes.json();
      const container = document.getElementById('comments-' + articleId);
      const listElem = container.querySelector('.comments-list');
      let loaded = parseInt(container.getAttribute('data-loaded')) || 0;
      if (startIndex === 0) {
        listElem.innerHTML = '';
        loaded = 0;
      }
      const count = (loaded === 0) ? 3 : 5;
      const newComments = comments.slice(loaded, loaded + count);
      newComments.forEach(c => {
        listElem.innerHTML += `
          <li style="margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <div style="font-size:0.8rem; color:#555;">
              ${c.user_email || '익명'} - ${c.created_at || ''}
            </div>
            <div style="font-size:0.95rem; margin-left:10px;">
              ${c.content}
            </div>
            ${
              (currentUserEmail() && c.user_email && currentUserEmail() === c.user_email)
              ? `<button class="btn-delete-comment" data-comment-id="${c.id}" style="background-color: crimson; color: white; border: none; padding:4px 8px; border-radius:4px; font-size:0.8rem;">삭제</button>`
              : ''
            }
          </li>
        `;
      });
      loaded += newComments.length;
      container.setAttribute('data-loaded', loaded.toString());
      const btnMore = container.querySelector('.btn-more-comments');
      if (loaded < comments.length) {
        btnMore.style.display = 'inline';
        btnMore.innerText = '↓더보기';
        btnMore.onclick = () => loadComments(articleId, loaded);
      } else {
        btnMore.style.display = 'none';
      }
      container.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.onclick = async () => {
          const commentId = btn.getAttribute('data-comment-id');
          if (confirm('댓글을 삭제하시겠습니까?')) {
            const res = await fetch(`/articles/comments/${commentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token() }
            });
            if (!res.ok) return alert('댓글 삭제 실패');
            btn.parentElement.remove();
          }
        };
      });
    } catch (e) {
      console.error("댓글 로딩 오류:", e);
      alert(e.message);
    }
  }

  function appendNewComment(articleId, comment) {
    const container = document.getElementById('comments-' + articleId);
    const listElem = container.querySelector('.comments-list');
    listElem.innerHTML += `
      <li style="margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
        <div style="font-size:0.8rem; color:#555;">
          ${comment.user_email || '익명'} - ${comment.created_at || ''}
        </div>
        <div style="font-size:0.95rem; margin-left:10px;">
          ${comment.content}
        </div>
        ${
          (currentUserEmail() && comment.user_email && currentUserEmail() === comment.user_email)
          ? `<button class="btn-delete-comment" data-comment-id="${comment.id}" style="background-color: crimson; color: white; border: none; padding:4px 8px; border-radius:4px; font-size:0.8rem;">삭제</button>`
          : ''
        }
      </li>
    `;
  }

  /* 로그인 폼 처리 */
  $('btn-login').onclick = () => {
    $('content').innerHTML = `
      <h2>로그인</h2>
      <form id="login-form" class="form-container">
        <input name="email" type="email" placeholder="이메일" required>
        <input name="password" type="password" placeholder="비밀번호" required>
        <button type="submit">로그인</button>
      </form>
    `;
    document.getElementById('login-form').onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value })
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
    };
  };

  /* 회원가입 폼 처리 */
  $('btn-signup').onclick = () => {
    $('content').innerHTML = `
      <h2>회원가입</h2>
      <form id="signup-form" class="form-container">
        <input name="email" type="email" placeholder="이메일" required>
        <input name="password" type="password" placeholder="비밀번호" required>
        <button type="submit">회원가입</button>
      </form>
    `;
    document.getElementById('signup-form').onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value })
      });
      if (res.ok) {
        alert('회원가입 완료!');
        $('btn-login').click();
      } else {
        const result = await res.json();
        alert(result.message);
      }
    };
  };

  /* 사용자 정보 표시 (로그인 시) */
  function setUser() {
    const emailVal = localStorage.getItem('email');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    if (emailVal && token()) {
      userInfo.innerText = `👤 ${emailVal}`;
      logoutBtn.style.display = 'inline-block';
    } else {
      userInfo.innerText = '';
      logoutBtn.style.display = 'none';
    }
  }
  
  setUser();
});
