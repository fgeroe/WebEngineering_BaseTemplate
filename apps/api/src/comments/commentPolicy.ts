import type { User } from '../users/user.js';
import type { CommentOwner } from './commentRepository.js';

/**
 * THE rule for deleting comments - the server enforces it here and only here.
 * Ownership check: authors may delete their own comments.
 * RBAC: users with the role "moderator" may delete every comment.
 */
export function canDeleteComment(
  user: User | null,
  comment: CommentOwner
): boolean {
  if (user === null) return false;
  return user.role === 'moderator' || comment.authorId === user.id;
}
