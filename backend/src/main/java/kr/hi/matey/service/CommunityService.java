package kr.hi.matey.service;

import kr.hi.matey.dao.CommentDAO;
import kr.hi.matey.dao.PostDAO;
import kr.hi.matey.dto.CategoryDTO;
import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.CommentDTO;
import kr.hi.matey.dto.PostCreateRequestDTO;
import kr.hi.matey.dto.PostDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostDAO postDAO;
    private final CommentDAO commentDAO;

    public List<CategoryDTO> getCategories() {
        return postDAO.selectCategories();
    }

    public List<PostDTO> getPosts(Long categoryId, String keyword, int limit, int offset) {
        return postDAO.selectPosts(categoryId, keyword, limit, offset);
    }

    @Transactional
    public Long createPost(PostCreateRequestDTO dto, long userId) {
        postDAO.insertPost(dto, userId);
        return dto.getPostId();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPostDetailWithComments(Long postId) {
        postDAO.incrementPostViewCount(postId);
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
    public void updatePost(Long postId, PostCreateRequestDTO dto, long userId) {
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

