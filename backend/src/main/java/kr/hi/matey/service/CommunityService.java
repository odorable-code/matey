package kr.hi.matey.service;

import kr.hi.matey.dao.CommentDAO;
import kr.hi.matey.dao.PostDAO;
import kr.hi.matey.dto.CategoryDTO;
import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.CommentDTO;
import kr.hi.matey.dto.PostCreateRequestDTO;
import kr.hi.matey.dto.PostDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostDAO postDAO;
    private final CommentDAO commentDAO;
    private final PostViewIncrementService postViewIncrementService;

    public List<CategoryDTO> getCategories() {
        return postDAO.selectCategories();
    }

    private static boolean isAdminRole(String roleCode) {
        if (roleCode == null) {
            return false;
        }
        String r = roleCode.trim().toUpperCase();
        return "ADMIN".equals(r) || "ROLE_ADMIN".equals(r);
    }

    /**
     * notification=0 인 카테고리(예: 공지)는 관리자만 글 작성·해당 카테고리로 수정 가능.
     */
    private void assertCategoryWritableByUser(Long categoryId, String roleCode) {
        if (categoryId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리를 선택해 주세요.");
        }
        Integer notification = postDAO.selectCategoryNotification(categoryId);
        if (notification == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 카테고리예요.");
        }
        if (notification == 0 && !isAdminRole(roleCode)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "공지 카테고리에는 관리자만 글을 작성할 수 있어요."
            );
        }
    }

    public List<PostDTO> getPosts(Long categoryId, String keyword, int limit, int offset) {
        return postDAO.selectPosts(categoryId, keyword, limit, offset);
    }

    @Transactional
    public Long createPost(PostCreateRequestDTO dto, long userId, String roleCode) {
        assertCategoryWritableByUser(dto.getCategoryId(), roleCode);
        postDAO.insertPost(dto, userId);
        return dto.getPostId();
    }

    /**
     * 조회수 증가는 {@link PostViewIncrementService}에서 REQUIRES_NEW로 처리해,
     * 상위 readOnly 트랜잭션이 있어도 UPDATE가 거부되지 않도록 함.
     */
    public Map<String, Object> getPostDetailWithComments(Long postId) {
        postViewIncrementService.incrementPostViewCount(postId);
        PostDTO post = postDAO.selectPostById(postId);
        List<CommentDTO> comments = commentDAO.selectCommentsByPost(postId);

        Map<String, Object> res = new HashMap<>();
        res.put("post", post);
        res.put("comments", comments);
        return res;
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getComments(Long postId) {
        return commentDAO.selectCommentsByPost(postId);
    }

    @Transactional
    public void createComment(Long postId, CommentCreateRequestDTO dto, long userId) {
        commentDAO.insertComment(dto, userId, postId);
    }

    @Transactional
    public void updatePost(Long postId, PostCreateRequestDTO dto, long userId, String roleCode) {
        assertCategoryWritableByUser(dto.getCategoryId(), roleCode);
        postDAO.updatePost(postId, dto, userId);
    }

    @Transactional
    public void deletePost(Long postId, long userId) {
        postDAO.deletePost(postId, userId);
    }

    @Transactional
    public void updateComment(Long commentId, CommentCreateRequestDTO dto, long userId) {
        commentDAO.updateComment(commentId, dto, userId);
    }

    @Transactional
    public void deleteComment(Long commentId, long userId) {
        commentDAO.deleteComment(commentId, userId);
    }
}

