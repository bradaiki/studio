#!/usr/bin/env python3
"""Seed all DynamoDB tables with mock data matching shared-mock-data.ts"""
import boto3
import json
import random
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

SUFFIX = "3346n5xiuvfyrl6nxinfzmmh5a-NONE"
client = boto3.client("dynamodb")

def s(val):
    """DynamoDB string attribute"""
    return {"S": str(val)} if val else {"S": ""}

def n(val):
    """DynamoDB number attribute"""
    return {"N": str(val)}

def b(val):
    """DynamoDB boolean attribute"""
    return {"BOOL": bool(val)}

def ss(vals):
    """DynamoDB string list attribute"""
    if not vals:
        return {"L": []}
    return {"L": [{"S": str(v)} for v in vals]}

def put(table_short, item):
    table_name = "{}-{}".format(table_short, SUFFIX)
    # Add id and timestamps
    if "id" not in item:
        item["id"] = s(str(uuid.uuid4()))
    now = datetime.now(timezone.utc).isoformat()
    if "createdAt" not in item:
        item["createdAt"] = s(now)
    if "updatedAt" not in item:
        item["updatedAt"] = s(now)
    # Add __typename
    item["__typename"] = s(table_short)
    client.put_item(TableName=table_name, Item=item)

def seed_arts():
    print("Seeding Arts...")
    arts = [
        {"name": "Aikido", "type": "aikido", "category": "martial-arts",
         "description": "Aikido is a modern Japanese martial art that emphasizes harmony and the redirection of an attacker's energy.",
         "shortDescription": "A Japanese martial art focused on harmony and redirecting energy",
         "image": "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format",
         "origin": "Japan, early 20th century", "difficulty": "intermediate", "physicalDemands": "moderate",
         "benefits": ["Improved balance", "Mental focus", "Stress reduction", "Self-defense", "Flexibility"],
         "techniques": ["Ikkyo", "Nikyo", "Sankyo", "Irimi", "Tenkan"],
         "equipment": ["Gi", "Hakama", "Bokken", "Jo", "Tanto"]},
        {"name": "Hatha Yoga", "type": "yoga", "category": "wellness",
         "description": "Traditional yoga focusing on physical postures, breathing techniques, and meditation.",
         "shortDescription": "Traditional yoga for body and mind balance",
         "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format",
         "origin": "India, ancient tradition", "difficulty": "beginner", "physicalDemands": "low",
         "benefits": ["Flexibility", "Better posture", "Stress reduction"],
         "techniques": ["Sun Salutation", "Warrior poses", "Tree pose"],
         "equipment": ["Yoga mat", "Blocks", "Strap"]},
        {"name": "Pottery", "type": "pottery", "category": "crafts",
         "description": "The ancient art of shaping clay into functional or decorative ceramic objects.",
         "shortDescription": "Creating ceramic art from clay",
         "image": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format",
         "origin": "Ancient civilizations worldwide", "difficulty": "intermediate", "physicalDemands": "moderate",
         "benefits": ["Stress relief", "Hand-eye coordination", "Focus"],
         "techniques": ["Wheel throwing", "Hand building", "Centering"],
         "equipment": ["Potter's wheel", "Clay", "Kiln"]},
        {"name": "Brazilian Jiu-Jitsu", "type": "jujitsu", "category": "martial-arts",
         "description": "Ground-fighting martial art emphasizing technique and leverage over strength.",
         "shortDescription": "The gentle art of ground fighting",
         "image": "https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format",
         "origin": "Brazil, early 20th century", "difficulty": "intermediate", "physicalDemands": "high",
         "benefits": ["Full-body workout", "Self-defense", "Problem-solving"],
         "techniques": ["Guard positions", "Mount control", "Submissions"],
         "equipment": ["BJJ gi", "Belt", "Rash guard"]},
        {"name": "Woodworking", "type": "woodworking", "category": "crafts",
         "description": "The craft of creating functional and artistic objects from wood.",
         "shortDescription": "Crafting with wood",
         "image": "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format",
         "origin": "Ancient craft worldwide", "difficulty": "intermediate", "physicalDemands": "moderate",
         "benefits": ["Practical skills", "Creative expression", "Stress relief"],
         "techniques": ["Measuring", "Sawing", "Joinery"],
         "equipment": ["Hand saws", "Power tools", "Clamps"]},
    ]
    for art in arts:
        put("Art", {
            "name": s(art["name"]), "type": s(art["type"]), "description": s(art["description"]),
            "shortDescription": s(art["shortDescription"]), "image": s(art["image"]),
            "category": s(art["category"]), "origin": s(art["origin"]),
            "difficulty": s(art["difficulty"]), "physicalDemands": s(art["physicalDemands"]),
            "benefits": ss(art["benefits"]), "techniques": ss(art["techniques"]),
            "equipment": ss(art["equipment"]),
            "isPublic": b(True), "isUserCreated": b(False), "isUserPracticing": b(False),
        })
    print("  Seeded {} arts".format(len(arts)))
    return arts

def seed_organizations():
    print("Seeding Organizations...")
    orgs = [
        {"name": "International Aikido Federation", "description": "Premier global Aikido organization", "type": "martial-arts", "foundedYear": 1976, "headquarters": "Tokyo, Japan", "memberCount": 50000, "website": "https://aikido-international.org", "contactEmail": "info@aikido-international.org", "isVerified": True},
        {"name": "Yoga Alliance", "description": "Largest yoga community association", "type": "wellness", "foundedYear": 1999, "headquarters": "Arlington, VA", "memberCount": 100000, "website": "https://yogaalliance.org", "contactEmail": "info@yogaalliance.org", "isVerified": True},
        {"name": "American Craft Council", "description": "Championing craft artists", "type": "crafts", "foundedYear": 1943, "headquarters": "Minneapolis, MN", "memberCount": 25000, "website": "https://craftcouncil.org", "contactEmail": "council@craftcouncil.org", "isVerified": True},
        {"name": "International BJJ Federation", "description": "Governing body for BJJ", "type": "martial-arts", "foundedYear": 1994, "headquarters": "Rio de Janeiro, Brazil", "memberCount": 75000, "website": "https://ibjjf.com", "contactEmail": "contact@ibjjf.com", "isVerified": True},
        {"name": "World Karate Federation", "description": "Olympic karate organization", "type": "martial-arts", "foundedYear": 1990, "headquarters": "Madrid, Spain", "memberCount": 200000, "website": "https://wkf.net", "contactEmail": "info@wkf.net", "isVerified": True},
        {"name": "National Pottery Association", "description": "Supporting ceramic artists", "type": "crafts", "foundedYear": 1985, "headquarters": "Portland, OR", "memberCount": 15000, "website": "https://pottery-association.org", "contactEmail": "hello@pottery-association.org", "isVerified": True},
        {"name": "International Yoga Federation", "description": "Promoting yoga education", "type": "wellness", "foundedYear": 1987, "headquarters": "New Delhi, India", "memberCount": 80000, "website": "https://iyf.org", "contactEmail": "contact@iyf.org", "isVerified": True},
        {"name": "Woodworkers Guild of America", "description": "Community of woodworkers", "type": "crafts", "foundedYear": 2008, "headquarters": "Denver, CO", "memberCount": 35000, "website": "https://wwgoa.com", "contactEmail": "support@wwgoa.com", "isVerified": True},
        {"name": "United States Judo Federation", "description": "Developing judo athletes", "type": "martial-arts", "foundedYear": 1952, "headquarters": "Colorado Springs, CO", "memberCount": 45000, "website": "https://usjf.com", "contactEmail": "info@usjf.com", "isVerified": True},
        {"name": "International Pilates Association", "description": "Pilates instruction standards", "type": "wellness", "foundedYear": 2005, "headquarters": "London, UK", "memberCount": 30000, "website": "https://pilates-association.org", "contactEmail": "info@pilates-association.org", "isVerified": True},
        {"name": "Global Martial Arts Federation", "description": "Uniting martial artists worldwide", "type": "martial-arts", "foundedYear": 2010, "headquarters": "Singapore", "memberCount": 120000, "website": "https://gmaf.org", "contactEmail": "contact@gmaf.org", "isVerified": True},
    ]
    for org in orgs:
        put("Organization", {
            "name": s(org["name"]), "description": s(org["description"]), "type": s(org["type"]),
            "foundedYear": n(org["foundedYear"]), "headquarters": s(org["headquarters"]),
            "memberCount": n(org["memberCount"]), "website": s(org["website"]),
            "contactEmail": s(org["contactEmail"]), "isVerified": b(org["isVerified"]),
        })
    print("  Seeded {} organizations".format(len(orgs)))
    return orgs

def seed_studios():
    print("Seeding Studios (107)...")
    cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Portland', 'Miami', 'Atlanta', 'Las Vegas', 'Detroit']
    studio_types = ['Dojo', 'Studio', 'Academy', 'Center', 'School', 'Institute', 'Workshop', 'Space']
    art_types = ['Aikido', 'Yoga', 'BJJ', 'Karate', 'Pottery', 'Woodworking', 'Pilates', 'Judo', 'Taekwondo']
    art_images = {
        'Aikido': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
        'Yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
        'BJJ': 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=400&fit=crop&auto=format',
        'Karate': 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
        'Pottery': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format',
        'Woodworking': 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format',
        'Pilates': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop&auto=format',
        'Judo': 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
        'Taekwondo': 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
    }
    studios = []
    count = 107
    for i in range(count):
        city = cities[i % len(cities)]
        stype = studio_types[i % len(studio_types)]
        art = art_types[i % len(art_types)]
        slug = "{}-{}-{}".format(city.lower().replace(" ", "-"), art.lower(), i)
        sid = str(uuid.uuid4())
        item = {
            "id": s(sid),
            "name": s("{} {} {}".format(city, art, stype)),
            "description": s("Premier {} training facility in {}".format(art.lower(), city)),
            "address": s("{} Main Street, {}".format(100 + i, city)),
            "city": s(city), "state": s("State"), "zipCode": s(str(10000 + i)), "country": s("USA"),
            "phone": s("(555) {}-{}".format(str(i).zfill(3), str(i * 10).zfill(4))),
            "email": s("info@{}.example.com".format(slug)),
            "website": s("https://{}.example.com".format(slug)),
            "heroImage": s(art_images.get(art, art_images["Aikido"])),
            "primaryArt": s(art.lower()),
            "instructorCount": n(random.randint(3, 12)),
            "memberCount": n(random.randint(50, 250)),
            "establishedYear": n(random.randint(1990, 2023)),
            "facilities": ss(["Training area", "Changing rooms", "Equipment storage"]),
            "amenities": ss(["Parking", "WiFi", "Water fountain"]),
            "isVerified": b(i % 3 == 0),
            "isMember": b(i < 15),
            "isInstructor": b(i < 8),
            "isStudioChief": b(i < 3),
        }
        put("Studio", item)
        studios.append({"id": sid, "name": item["name"]["S"], "address": item["address"]["S"],
                        "email": item["email"]["S"], "phone": item["phone"]["S"]})
        if (i + 1) % 25 == 0:
            print("  ... {} studios".format(i + 1))
    print("  Seeded {} studios".format(count))
    return studios

def seed_people():
    print("Seeding People (156)...")
    first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle']
    last_names = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green']

    # Cognito user IDs for well-known users
    TONY_USER_ID = "74b874a8-a0e1-7052-d963-51a1303f1c2b"   # brad@aikicode.com
    WINNIE_USER_ID = "6478c468-b011-70e0-b5bb-e11009070cc4"  # brad@aikicode.org

    people = []

    # @Tony - admin
    put("Person", {
        "id": s(TONY_USER_ID),
        "userId": s(TONY_USER_ID),
        "handle": s("@Tony"), "displayName": s("Tony"), "name": s("Tony"), "username": s("Tony"),
        "bio": s("Platform administrator and developer"), "location": s("HQ"),
        "profileImage": s("https://ui-avatars.com/api/?name=Tony&size=300&background=random&color=fff"),
        "avatar": s("https://ui-avatars.com/api/?name=Tony&size=300&background=random&color=fff"),
        "isInstructor": b(False), "isVerified": b(True), "isAdmin": b(True),
        "joinedDate": s("2020-01-01T00:00:00.000Z"),
        "followers": n(0), "following": n(0), "postsCount": n(0),
    })
    people.append({"id": TONY_USER_ID, "handle": "@Tony", "displayName": "Tony",
                   "profileImage": "https://ui-avatars.com/api/?name=Tony&size=300&background=random&color=fff"})

    # @Winnie
    put("Person", {
        "id": s(WINNIE_USER_ID),
        "userId": s(WINNIE_USER_ID),
        "handle": s("@Winnie"), "displayName": s("Winnie"), "name": s("Winnie"), "username": s("Winnie"),
        "bio": s("Just browsing"), "location": s(""),
        "profileImage": s("https://ui-avatars.com/api/?name=Winnie&size=300&background=random&color=fff"),
        "avatar": s("https://ui-avatars.com/api/?name=Winnie&size=300&background=random&color=fff"),
        "isInstructor": b(False), "isVerified": b(False), "isAdmin": b(False),
        "joinedDate": s("2024-01-01T00:00:00.000Z"),
        "followers": n(0), "following": n(0), "postsCount": n(0),
    })
    people.append({"id": WINNIE_USER_ID, "handle": "@Winnie", "displayName": "Winnie",
                   "profileImage": "https://ui-avatars.com/api/?name=Winnie&size=300&background=random&color=fff"})

    count = 154
    for i in range(count):
        fn = first_names[i % len(first_names)]
        ln = last_names[(i // len(first_names)) % len(last_names)]
        handle = "{}_{}_{}".format(fn.lower(), ln.lower(), i)
        display = "{} {}".format(fn, ln)
        avatar = "https://ui-avatars.com/api/?name={}&size=300&background=random&color=fff".format(quote("{} {}".format(fn, ln)))
        yr = random.randint(2020, 2024)
        mo = random.randint(1, 12)
        dy = random.randint(1, 28)
        joined = "{}-{}-{}T00:00:00.000Z".format(yr, str(mo).zfill(2), str(dy).zfill(2))
        yrs_exp = random.randint(1, 20)

        pid = str(uuid.uuid4())
        put("Person", {
            "id": s(pid),
            "userId": s(pid),
            "handle": s(handle), "displayName": s(display), "name": s(display), "username": s(handle),
            "bio": s("Passionate practitioner and instructor with {} years of experience".format(yrs_exp)),
            "location": s("City {}".format(i % 25)),
            "website": s("https://example.com/users/{}".format(handle)),
            "profileImage": s(avatar), "avatar": s(avatar),
            "isInstructor": b(i % 5 == 0), "isVerified": b(i % 10 == 0), "isAdmin": b(False),
            "joinedDate": s(joined),
            "followers": n(0), "following": n(0), "postsCount": n(0),
        })
        people.append({"id": pid, "handle": handle, "displayName": display, "profileImage": avatar})
        if (i + 1) % 50 == 0:
            print("  ... {} people".format(i + 3))  # +2 for Tony and Winnie

    print("  Seeded {} people".format(len(people)))
    return people

def seed_posts(people):
    print("Seeding Posts (153)...")
    contents = [
        'Just completed an amazing training session!',
        'Excited to share my progress with the community',
        'Looking forward to the upcoming workshop',
        'Great class today, learned so much',
        'Proud of my students\' achievements',
        'New technique unlocked!',
        'Training hard for the next competition',
        'Grateful for this incredible journey',
        'Another milestone reached',
        'The community here is amazing',
    ]
    count = 153
    for i in range(count):
        author = people[i % len(people)]
        mo = random.randint(1, 12)
        dy = random.randint(1, 28)
        put("Post", {
            "content": s("{} #{}".format(contents[i % len(contents)], i)),
            "authorId": s(author["id"]),
            "authorName": s(author["displayName"]),
            "authorHandle": s(author["handle"]),
            "authorImage": s(author["profileImage"]),
            "likes": n(random.randint(0, 99)),
            "comments": n(random.randint(0, 19)),
            "shares": n(random.randint(0, 9)),
            "images": ss([]), "tags": ss([]),
            "isPublic": b(True),
        })
        if (i + 1) % 50 == 0:
            print("  ... {} posts".format(i + 1))
    print("  Seeded {} posts".format(count))

def seed_events(studios):
    print("Seeding Events (23)...")
    event_names = ['Beginner', 'Advanced', 'Master Class', 'Special', 'Annual', 'Monthly']
    event_types = ['seminar', 'workshop', 'tournament', 'meetup']
    difficulties = ['beginner', 'intermediate', 'advanced', 'all-levels']
    event_images = [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=400&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
    ]
    count = 23
    for i in range(count):
        studio = studios[i % len(studios)]
        etype = event_types[i % len(event_types)]
        diff = difficulties[i % len(difficulties)]
        is_free = i % 5 == 0
        price = 0 if is_free else random.randint(25, 124)
        mo = random.randint(2, 7)
        dy = random.randint(1, 28)
        hr = random.randint(9, 17)
        start = "2026-{}-{}T{}:00:00.000Z".format(str(mo).zfill(2), str(dy).zfill(2), str(hr).zfill(2))
        end_hr = hr + random.randint(2, 5)
        end = "2026-{}-{}T{}:00:00.000Z".format(str(mo).zfill(2), str(dy).zfill(2), str(min(end_hr, 23)).zfill(2))

        put("Event", {
            "title": s("{} {}".format(event_names[i % len(event_names)], etype.capitalize())),
            "description": s("Join us for an exciting {} event. This {} level event is perfect for practitioners.".format(etype, diff)),
            "startDate": s(start), "endDate": s(end),
            "location": s(studio["name"]), "address": s(studio["address"]),
            "city": s(""), "state": s(""), "zipCode": s(""),
            "organizerId": s(studio["id"]), "organizerName": s(studio["name"]),
            "maxAttendees": n(random.randint(20, 69)),
            "currentAttendees": n(random.randint(0, 14)),
            "price": n(price),
            "isVirtual": b(False), "isFree": b(is_free),
            "tags": ss([etype, diff, "training", "community"]),
            "image": s(event_images[i % len(event_images)]),
        })
    print("  Seeded {} events".format(count))


if __name__ == "__main__":
    print("=== Seeding DynamoDB ===\n")
    arts = seed_arts()
    orgs = seed_organizations()
    studios = seed_studios()
    people = seed_people()
    seed_posts(people)
    seed_events(studios)
    print("\n=== Seeding complete ===")
    print("  Arts: 5")
    print("  Organizations: 11")
    print("  Studios: 107")
    print("  People: 156")
    print("  Posts: 153")
    print("  Events: 23")
    print("  Total: 455 records")
