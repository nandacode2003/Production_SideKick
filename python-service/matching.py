"""
SideKick Matching Algorithm
============================
Score = 0.35 * interest_score + 0.25 * availability_score + 0.25 * distance_score + 0.15 * safety_score

All scores normalized to 0–100.
"""

import math

# ── INTEREST SCORE ────────────────────────────────────────
def interest_score(user_interests, candidate_interests):
    a = set(user_interests or [])
    b = set(candidate_interests or [])
    if not a or not b:
        return 0
    intersection = len(a & b)
    union = len(a | b)
    return round((intersection / union) * 100, 2)

# ── AVAILABILITY SCORE ────────────────────────────────────
def availability_score(user_avail, cand_avail):
    def flatten(avail):
        slots = set()
        for entry in (avail or []):
            for slot in entry.get('slots', []):
                slots.add((entry['day'], slot))
        return slots

    u = flatten(user_avail)
    c = flatten(cand_avail)
    if not u:
        return 50
    overlap = len(u & c)
    return round(min((overlap / len(u)) * 100, 100), 2)

# ── DISTANCE SCORE ────────────────────────────────────────
def haversine_km(lat1, lng1, lat2, lng2):
    if None in (lat1, lng1, lat2, lng2):
        return None
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def distance_score(lat1, lng1, lat2, lng2, max_km=30):
    km = haversine_km(lat1, lng1, lat2, lng2)
    if km is None:
        return 50
    if km >= max_km:
        return 0
    return round((1 - km / max_km) * 100, 2)

# ── SAFETY SCORE ──────────────────────────────────────────
def safety_score(candidate_safety_score):
    return min(max(candidate_safety_score or 100, 0), 100)

# ── MAIN COMPUTE ──────────────────────────────────────────
def compute_matches(user, candidates):
    results = []
    for c in candidates:
        i = interest_score(user.get('interests'), c.get('interests'))
        a = availability_score(user.get('availability'), c.get('availability'))
        d = distance_score(user.get('lat'), user.get('lng'), c.get('lat'), c.get('lng'))
        s = safety_score(c.get('safetyScore'))

        total = round(0.35*i + 0.25*a + 0.25*d + 0.15*s, 2)

        results.append({
            "candidateId": str(c['id']),
            "totalScore": total,
            "interestScore": i,
            "availabilityScore": a,
            "distanceScore": d,
            "safetyScore": s
        })

    results.sort(key=lambda x: x['totalScore'], reverse=True)
    return results[:20]
