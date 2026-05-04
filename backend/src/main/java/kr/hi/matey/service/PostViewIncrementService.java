package kr.hi.matey.service;

import kr.hi.matey.dao.PostDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostViewIncrementService {

    private final PostDAO postDAO;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void incrementPostViewCount(Long postId) {
        postDAO.incrementPostViewCount(postId);
    }
}
