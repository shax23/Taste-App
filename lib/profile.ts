import { prisma } from './prisma';
import { recalculateAndStore, tierForScore } from './credibility';
import { CATEGORY_LABELS, CATEGORIES } from './interests';

const STALE_MS = 60 * 60 * 1000;

/** Load everything a profile page needs; recalculates a stale score. */
export async function loadProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      credibilityScore: true,
      interests: { include: { interest: true }, orderBy: { strength: 'desc' } },
      posts: {
        include: {
          place: true,
          interests: { include: { interest: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      receivedValidations: { select: { id: true } },
    },
  });
  if (!user) return null;

  let score = user.credibilityScore;
  if (!score || Date.now() - score.lastCalculated.getTime() > STALE_MS) {
    await recalculateAndStore(user.id);
    score = await prisma.credibilityScore.findUnique({ where: { userId: user.id } });
  }

  // taste map: interest-category strengths from interests + tagged posts
  const tasteMap = CATEGORIES.map((category) => {
    const interestCount = user.interests.filter(
      (ui) => ui.interest.category === category
    ).length;
    const postCount = user.posts.filter((p) =>
      p.interests.some((pi) => pi.interest.category === category)
    ).length;
    return {
      category: CATEGORY_LABELS[category],
      strength: Math.min(100, interestCount * 30 + postCount * 10),
    };
  });

  // unique places with post counts
  const placeMap = new Map<
    string,
    { id: string; name: string; category: string; city: string; postCount: number }
  >();
  for (const post of user.posts) {
    if (!post.place) continue;
    const entry = placeMap.get(post.place.id) ?? {
      id: post.place.id,
      name: post.place.name,
      category: post.place.category,
      city: post.place.city,
      postCount: 0,
    };
    entry.postCount++;
    placeMap.set(post.place.id, entry);
  }

  const totalScore = score?.totalScore ?? 0;

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      city: user.city,
      createdAt: user.createdAt,
    },
    score: {
      totalScore,
      tier: tierForScore(totalScore),
      tasteSignalStrength: score?.tasteSignalStrength ?? 0,
      peerValidationDensity: score?.peerValidationDensity ?? 0,
      consistencyBonus: score?.consistencyBonus ?? 0,
      importedFollowerScore: score?.importedFollowerScore ?? 0,
    },
    interests: user.interests.map((ui) => ({
      slug: ui.interest.slug,
      label: ui.interest.label,
      emoji: ui.interest.emoji,
      category: ui.interest.category,
    })),
    tasteMap,
    posts: user.posts.map((p) => ({
      id: p.id,
      content: p.content,
      postType: p.postType,
      createdAt: p.createdAt.toISOString(),
      placeName: p.place?.name ?? null,
      placeId: p.place?.id ?? null,
    })),
    places: [...placeMap.values()],
    validationCount: user.receivedValidations.length,
  };
}
