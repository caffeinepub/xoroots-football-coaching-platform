import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  module Post {
    public func compare(post1 : Post, post2 : Post) : Order.Order {
      switch (Int.compare(post1.timestamp, post2.timestamp)) {
        case (#equal) {
          switch (Text.compare(post1.id, post2.id)) {
            case (#equal) { post1.author.toText().compare(post2.author.toText()) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  module JobPost {
    public func compare(post1 : JobPost, post2 : JobPost) : Order.Order {
      switch (Int.compare(post1.timestamp, post2.timestamp)) {
        case (#equal) { Text.compare(post1.id, post2.id) };
        case (order) { order };
      };
    };
  };

  module CoachProfile {
    public func compare(profile1 : CoachProfile, profile2 : CoachProfile) : Order.Order {
      switch (Text.compare(profile1.name, profile2.name)) {
        case (#equal) { profile1.userId.compare(profile2.userId) };
        case (order) { order };
      };
    };
  };

  type Post = {
    id : Text;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    attachments : [Attachment];
    likes : [Principal];
    comments : [Comment];
  };

  public type Attachment = {
    blob : Storage.ExternalBlob;
    mimeType : Text;
    fileName : Text;
  };

  type Comment = {
    id : Text;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    likes : [Principal];
  };

  type DirectMessage = {
    sender : Principal;
    receiver : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type GroupMessage = {
    groupId : Text;
    sender : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type JobPost = {
    id : Text;
    title : Text;
    poster : Principal;
    timestamp : Time.Time;
    role : Text;
    level : Text;
    schoolOrOrganization : Text;
    location : Text;
    compensation : ?Text;
    requirements : Text;
    additionalInfo : Text;
    applications : [Application];
  };

  type Application = {
    applicant : Principal;
    profile : CoachProfile;
    coverLetter : Text;
    timestamp : Time.Time;
  };

  type CoachProfile = {
    userId : Principal;
    name : Text;
    experience : Nat;
    specialty : Text;
    certifications : [Text];
    bio : Text;
    positionsCoached : [Text];
    location : Text;
    coachingRoles : [Text];
    photo : ?Storage.ExternalBlob;
  };

  type ViewedPosts = {
    viewedPosts : Set.Set<Text>;
  };

  type CoachProfileDetail = {
    profile : CoachProfile;
    posts : [Post];
    jobs : [JobPost];
    comments : [Comment];
    isAdmin : Bool;
    followersCount : Nat;
    followingCount : Nat;
    followers : [Principal];
    following : [Principal];
  };

  let coachProfiles = Map.empty<Principal, CoachProfile>();
  let socialFeed = Map.empty<Text, Post>();
  let directMessages = List.empty<DirectMessage>();
  let groupMessages = List.empty<GroupMessage>();
  let jobPosts = Map.empty<Text, JobPost>();
  let viewedPosts = Map.empty<Principal, ViewedPosts>();
  let adminBanners = Map.empty<Principal, Bool>();

  let followRelations = Map.empty<Principal, Set.Set<Principal>>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  func createDefaultProfile(userId : Principal) : CoachProfile {
    {
      userId = userId;
      name = "";
      experience = 0;
      specialty = "";
      certifications = [];
      photo = null;
      bio = "";
      positionsCoached = [];
      location = "";
      coachingRoles = [];
    };
  };

  func ensureProfileExistsInternal(userId : Principal) : CoachProfile {
    switch (coachProfiles.get(userId)) {
      case (?profile) { profile };
      case (null) {
        let defaultProfile = createDefaultProfile(userId);
        coachProfiles.add(userId, defaultProfile);
        defaultProfile;
      };
    };
  };

  public query ({ caller }) func getCoachCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coach count");
    };
    coachProfiles.size();
  };

  public shared ({ caller }) func getCallerUserProfile() : async ?CoachProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    ?ensureProfileExistsInternal(caller);
  };

  public shared ({ caller }) func initializeCallerProfile() : async ?CoachProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize profiles");
    };
    ?ensureProfileExistsInternal(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?CoachProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    // All authenticated users can view any profile (public directory)
    coachProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : CoachProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.userId != caller) {
      Runtime.trap("Unauthorized: Cannot save profile for another user");
    };

    let validatedProfile : CoachProfile = {
      userId = caller;
      name = profile.name;
      experience = profile.experience;
      specialty = profile.specialty;
      certifications = profile.certifications;
      photo = profile.photo;
      bio = profile.bio;
      positionsCoached = profile.positionsCoached;
      location = profile.location;
      coachingRoles = profile.coachingRoles;
    };

    coachProfiles.add(caller, validatedProfile);
  };

  public shared ({ caller }) func createProfile(
    name : Text,
    experience : Nat,
    specialty : Text,
    certifications : [Text],
    photo : ?Storage.ExternalBlob,
    bio : Text,
    positionsCoached : [Text],
    location : Text,
    coachingRoles : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can create profiles");
    };
    let profile : CoachProfile = {
      userId = caller;
      name;
      experience;
      specialty;
      certifications;
      photo;
      bio;
      positionsCoached;
      location;
      coachingRoles;
    };
    coachProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateProfile(
    name : Text,
    experience : Nat,
    specialty : Text,
    certifications : [Text],
    photo : ?Storage.ExternalBlob,
    bio : Text,
    positionsCoached : [Text],
    location : Text,
    coachingRoles : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can update profiles");
    };
    ignore ensureProfileExistsInternal(caller);
    let profile : CoachProfile = {
      userId = caller;
      name;
      experience;
      specialty;
      certifications;
      photo;
      bio;
      positionsCoached;
      location;
      coachingRoles;
    };
    coachProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile(userId : Principal) : async ?CoachProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    coachProfiles.get(userId);
  };

  public query ({ caller }) func getAllProfiles() : async [CoachProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can browse profiles");
    };
    coachProfiles.values().toArray().sort();
  };

  public shared ({ caller }) func createPost(content : Text, attachments : [Attachment]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can create posts");
    };
    ignore ensureProfileExistsInternal(caller);
    let postId = caller.toText().concat(Time.now().toText());
    let post : Post = {
      id = postId;
      author = caller;
      content;
      timestamp = Time.now();
      attachments;
      likes = [];
      comments = [];
    };
    socialFeed.add(postId, post);
  };

  public query ({ caller }) func getFeed() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view the feed");
    };
    socialFeed.values().toArray().sort();
  };

  public query ({ caller }) func getPost(postId : Text) : async ?Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view posts");
    };
    socialFeed.get(postId);
  };

  public shared ({ caller }) func toggleLikePost(postId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can like posts");
    };
    ignore ensureProfileExistsInternal(caller);
    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let currentLikes = post.likes;
        let hasLiked = currentLikes.any(func(author) { author == caller });

        let updatedLikes = if (hasLiked) {
          currentLikes.filter(func(likedAuthor) { likedAuthor != caller });
        } else {
          currentLikes.concat([caller]);
        };

        let updatedPost : Post = {
          id = post.id;
          author = post.author;
          content = post.content;
          timestamp = post.timestamp;
          attachments = post.attachments;
          likes = updatedLikes;
          comments = post.comments;
        };

        socialFeed.add(postId, updatedPost);

        not hasLiked;
      };
    };
  };

  public shared ({ caller }) func addComment(postId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can comment on posts");
    };
    ignore ensureProfileExistsInternal(caller);
    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let newComment : Comment = {
          id = caller.toText().concat(Time.now().toText());
          author = caller;
          content;
          timestamp = Time.now();
          likes = [];
        };
        let updatedComments = post.comments.concat([newComment]);
        let updatedPost : Post = {
          id = post.id;
          author = post.author;
          content = post.content;
          timestamp = post.timestamp;
          attachments = post.attachments;
          likes = post.likes;
          comments = updatedComments;
        };
        socialFeed.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func updatePost(postId : Text, newContent : Text, newAttachments : [Attachment]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can update posts");
    };

    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?originalPost) {
        if (originalPost.author != caller) {
          Runtime.trap("Unauthorized: Cannot update post written by other user");
        };

        let updatedPost : Post = {
          id = originalPost.id;
          author = originalPost.author;
          content = newContent;
          timestamp = originalPost.timestamp;
          attachments = newAttachments;
          likes = originalPost.likes;
          comments = originalPost.comments;
        };

        socialFeed.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func sendDirectMessage(receiver : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can send messages");
    };
    ignore ensureProfileExistsInternal(caller);
    let message : DirectMessage = {
      sender = caller;
      receiver;
      content;
      timestamp = Time.now();
    };
    directMessages.add(message);
  };

  public query ({ caller }) func getDirectMessages(otherUser : Principal) : async [DirectMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view messages");
    };
    let filtered = directMessages.filter(
      func(msg : DirectMessage) : Bool {
        (msg.sender == caller and msg.receiver == otherUser) or (msg.sender == otherUser and msg.receiver == caller)
      },
    );
    filtered.toArray();
  };

  public shared ({ caller }) func sendGroupMessage(groupId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can send group messages");
    };
    ignore ensureProfileExistsInternal(caller);
    let message : GroupMessage = {
      groupId;
      sender = caller;
      content;
      timestamp = Time.now();
    };
    groupMessages.add(message);
  };

  public query ({ caller }) func getGroupMessages(groupId : Text) : async [GroupMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view group messages");
    };
    let filtered = groupMessages.filter(
      func(msg : GroupMessage) : Bool {
        msg.groupId == groupId
      },
    );
    filtered.toArray();
  };

  public shared ({ caller }) func connectWithCoach(coachId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can connect");
    };
    if (caller == coachId) {
      Runtime.trap("Cannot connect with yourself");
    };
    ignore ensureProfileExistsInternal(caller);
    let userConnections = switch (followRelations.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?c) { c };
    };
    userConnections.add(coachId);
    followRelations.add(caller, userConnections);
  };

  public query ({ caller }) func getConnections(userId : Principal) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view connections");
    };
    // All authenticated users can view any user's connections (public information)
    switch (followRelations.get(userId)) {
      case (null) { [] };
      case (?userConnections) { userConnections.values().toArray() };
    };
  };

  public query ({ caller }) func getMyConnections() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view connections");
    };
    switch (followRelations.get(caller)) {
      case (null) { [] };
      case (?userConnections) { userConnections.values().toArray() };
    };
  };

  public shared ({ caller }) func postJob(
    title : Text,
    role : Text,
    level : Text,
    schoolOrOrganization : Text,
    location : Text,
    compensation : ?Text,
    requirements : Text,
    additionalInfo : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can post jobs");
    };
    ignore ensureProfileExistsInternal(caller);
    let jobId = caller.toText().concat(Time.now().toText());
    let job : JobPost = {
      id = jobId;
      title;
      poster = caller;
      timestamp = Time.now();
      role;
      level;
      schoolOrOrganization;
      location;
      compensation;
      requirements;
      additionalInfo;
      applications = [];
    };
    jobPosts.add(jobId, job);
  };

  public shared ({ caller }) func applyForJob(jobId : Text, coverLetter : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can apply for jobs");
    };
    let profile = ensureProfileExistsInternal(caller);
    switch (jobPosts.get(jobId)) {
      case (null) { Runtime.trap("Job does not exist") };
      case (?job) {
        if (job.poster == caller) {
          Runtime.trap("Cannot apply to your own job posting");
        };
        let application : Application = {
          applicant = caller;
          profile;
          coverLetter;
          timestamp = Time.now();
        };
        let updatedApplications = job.applications.concat([application]);
        let updatedJob : JobPost = {
          id = job.id;
          title = job.title;
          poster = job.poster;
          timestamp = job.timestamp;
          role = job.role;
          level = job.level;
          schoolOrOrganization = job.schoolOrOrganization;
          location = job.location;
          compensation = job.compensation;
          requirements = job.requirements;
          additionalInfo = job.additionalInfo;
          applications = updatedApplications;
        };
        jobPosts.add(jobId, updatedJob);
      };
    };
  };

  public query ({ caller }) func getJobPostings() : async [JobPost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view job postings");
    };
    jobPosts.values().toArray().sort();
  };

  public query ({ caller }) func getJobApplications(jobId : Text) : async [Application] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view applications");
    };
    switch (jobPosts.get(jobId)) {
      case (null) { Runtime.trap("Job does not exist") };
      case (?job) {
        if (job.poster != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only job poster or admins can view applications");
        };
        job.applications;
      };
    };
  };

  public query ({ caller }) func getMyApplications() : async [(Text, Application)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view their applications");
    };
    let result = List.empty<(Text, Application)>();
    for ((jobId, job) in jobPosts.entries()) {
      for (application in job.applications.values()) {
        if (application.applicant == caller) {
          result.add((jobId, application));
        };
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete posts");
    };
    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?_) {
        socialFeed.remove(postId);
      };
    };
  };

  public shared ({ caller }) func deleteJobPosting(jobId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete job postings");
    };
    switch (jobPosts.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?_) {
        jobPosts.remove(jobId);
      };
    };
  };

  public query ({ caller }) func getCoachPhoto(coachId : Principal) : async (?Storage.ExternalBlob) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profile photos");
    };
    switch (coachProfiles.get(coachId)) {
      case (null) { null };
      case (?profile) { profile.photo };
    };
  };

  public shared ({ caller }) func saveProfilePhoto(photo : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profile photos");
    };
    let profile = ensureProfileExistsInternal(caller);
    let updatedProfile : CoachProfile = {
      userId = profile.userId;
      name = profile.name;
      experience = profile.experience;
      specialty = profile.specialty;
      certifications = profile.certifications;
      photo = ?photo;
      bio = profile.bio;
      positionsCoached = profile.positionsCoached;
      location = profile.location;
      coachingRoles = profile.coachingRoles;
    };
    coachProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getFeedCategories() : async {
    forYou : [Post];
    following : [Post];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view feed categories");
    };

    func getEngagement(post : Post) : Int {
      post.likes.size() + post.comments.size();
    };

    let allPosts = socialFeed.values().toArray();
    let userConnections = switch (followRelations.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?c) { c };
    };

    let forYouPosts = allPosts.filter(
      func(post) {
        not userConnections.contains(post.author);
      }
    ).sort(
        func(a, b) {
          Int.compare(getEngagement(b), getEngagement(a));
        }
      );

    let followingPosts = allPosts.filter(
      func(post) {
        userConnections.contains(post.author);
      }
    );

    {
      forYou = forYouPosts;
      following = followingPosts;
    };
  };

  public shared ({ caller }) func markPostViewed(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can mark posts as viewed");
    };
    ignore ensureProfileExistsInternal(caller);
    let userViewed = switch (viewedPosts.get(caller)) {
      case (null) { { viewedPosts = Set.empty<Text>() } };
      case (?viewed) { viewed };
    };
    userViewed.viewedPosts.add(postId);
    viewedPosts.add(caller, userViewed);
  };

  public shared ({ caller }) func markPostsViewed(postIds : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can mark posts as viewed");
    };
    ignore ensureProfileExistsInternal(caller);
    let userViewed = switch (viewedPosts.get(caller)) {
      case (null) { { viewedPosts = Set.empty<Text>() } };
      case (?viewed) { viewed };
    };
    for (id in postIds.values()) {
      userViewed.viewedPosts.add(id);
    };
    viewedPosts.add(caller, userViewed);
  };

  public query ({ caller }) func hasNewBannerNotification() : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check banner notifications");
    };
    switch (adminBanners.get(caller)) {
      case (null) { false };
      case (?hasNotification) { hasNotification };
    };
  };

  public shared ({ caller }) func dismissBannerNotification() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can dismiss banner notifications");
    };
    adminBanners.add(caller, false);
  };

  public query ({ caller }) func getCoachProfileDetail(coachId : Principal) : async ?CoachProfileDetail {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view profile details");
    };
    switch (coachProfiles.get(coachId)) {
      case (null) { null };
      case (?profile) {
        let posts = socialFeed.values().toArray().filter(func(p) { p.author == coachId });
        let jobs = jobPosts.values().toArray().filter(func(j) { j.poster == coachId });

        let commentsList = List.empty<Comment>();
        for (post in socialFeed.values()) {
          let filtered = post.comments.filter(func(c) { c.author == coachId });
          commentsList.addAll(filtered.values());
        };

        let comments = commentsList.toArray();
        let isAdmin = AccessControl.isAdmin(accessControlState, coachId);

        let following = switch (followRelations.get(coachId)) {
          case (null) { Set.empty<Principal>() };
          case (?f) { f };
        };
        let followers = followRelations.entries().filter(func((_, set)) { set.contains(coachId) }).map(func((userId, _)) { userId });

        ?{
          profile;
          posts;
          jobs;
          comments;
          isAdmin;
          followersCount = followers.size();
          followingCount = following.size();
          followers = followers.toArray();
          following = following.values().toArray();
        };
      };
    };
  };

  public shared ({ caller }) func submitReport() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can submit reports");
    };
    ignore ensureProfileExistsInternal(caller);
    for ((admin, _) in adminBanners.entries()) {
      adminBanners.add(admin, true);
    };
  };

  public shared ({ caller }) func followCoach(coachToFollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can follow other coaches");
    };

    if (caller == coachToFollow) {
      Runtime.trap("Cannot follow yourself");
    };

    let currentFollowing = switch (followRelations.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?f) { f };
    };

    if (currentFollowing.contains(coachToFollow)) {
      Runtime.trap("Already following this coach");
    };

    currentFollowing.add(coachToFollow);
    followRelations.add(caller, currentFollowing);
  };

  public shared ({ caller }) func unfollowCoach(coachToUnfollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can unfollow other coaches");
    };

    let currentFollowing = switch (followRelations.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?f) { f };
    };

    currentFollowing.remove(coachToUnfollow);

    if (currentFollowing.isEmpty()) {
      followRelations.remove(caller);
    } else {
      followRelations.add(caller, currentFollowing);
    };
  };

  public query ({ caller }) func getFollowers(coachId : Principal) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view followers");
    };
    let followers = List.empty<Principal>();
    for ((follower, followingSet) in followRelations.entries()) {
      if (followingSet.contains(coachId)) {
        followers.add(follower);
      };
    };
    followers.toArray();
  };

  public query ({ caller }) func getFollowing(coachId : Principal) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view following");
    };
    switch (followRelations.get(coachId)) {
      case (null) { [] };
      case (?followingSet) { followingSet.values().toArray() };
    };
  };

  public query ({ caller }) func getFollowersCount(coachId : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view follower count");
    };
    var followers = 0;
    for ((_, followingSet) in followRelations.entries()) {
      if (followingSet.contains(coachId)) {
        followers += 1;
      };
    };
    followers;
  };

  public query ({ caller }) func getFollowingCount(coachId : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view following count");
    };
    switch (followRelations.get(coachId)) {
      case (null) { 0 };
      case (?followingSet) { followingSet.size() };
    };
  };

  public query ({ caller }) func isFollowing(callerId : Principal, coachId : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can check following status");
    };
    switch (followRelations.get(callerId)) {
      case (null) { false };
      case (?followingSet) { followingSet.contains(coachId) };
    };
  };

  public query ({ caller }) func getFollowerDetails(followerId : Principal, coachId : Principal) : async (Bool, [(Principal, CoachProfile)], [(Principal, CoachProfile)]) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can view follower details");
    };

    switch (coachProfiles.get(followerId)) {
      case (null) {
        (false, [(followerId, createDefaultProfile(followerId))], []);
      };
      case (?followerProfile) {
        let allProfiles = coachProfiles.values().toArray();
        let following = allProfiles.filter(func(profile) { profile.userId == coachId });
        let isFollowingCoach = switch (followRelations.get(followerId)) {
          case (null) { false };
          case (?followingSet) { followingSet.contains(coachId) };
        };
        (isFollowingCoach, [(followerId, followerProfile)], following.map(func(profile) { (profile.userId, profile) }));
      };
    };
  };

  public shared ({ caller }) func deleteUser(target : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete user accounts");
    };

    // Prevent self-deletion
    if (caller == target) {
      Runtime.trap("Cannot delete your own account");
    };

    // Prevent deletion of other admins
    if (AccessControl.isAdmin(accessControlState, target)) {
      Runtime.trap("Cannot delete admin accounts");
    };

    switch (coachProfiles.get(target)) {
      case (null) { Runtime.trap("User not found") };
      case (?_) {
        coachProfiles.remove(target);
      };
    };
  };

  public shared ({ caller }) func toggleLikeComment(postId : Text, commentId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can like comments");
    };
    ignore ensureProfileExistsInternal(caller);

    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        func findAndUpdateComment(comment : Comment) : Comment {
          let hasLiked = comment.likes.any(func(likedBy) { likedBy == caller });

          let updatedLikes : [Principal] = switch (hasLiked) {
            case (true) {
              comment.likes.filter(func(liked) { liked != caller });
            };
            case (false) {
              comment.likes.concat([caller]);
            };
          };

          {
            id = comment.id;
            author = comment.author;
            content = comment.content;
            timestamp = comment.timestamp;
            likes = updatedLikes;
          };
        };

        let updatedComments = post.comments.map(
          func(comment) {
            if (comment.id == commentId) {
              return findAndUpdateComment(comment);
            };
            comment;
          }
        );

        let updatedPost : Post = {
          id = post.id;
          author = post.author;
          content = post.content;
          timestamp = post.timestamp;
          attachments = post.attachments;
          likes = post.likes;
          comments = updatedComments;
        };

        socialFeed.add(postId, updatedPost);

        updatedComments.any(func(comment) { comment.id == commentId and comment.likes.any(func(likedBy) { likedBy == caller }) });
      };
    };
  };

  public shared ({ caller }) func deleteComment(postId : Text, commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only coaches can delete comments");
    };

    switch (socialFeed.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let commentToDelete = post.comments.find(func(comment) { comment.id == commentId });

        switch (commentToDelete) {
          case (null) { Runtime.trap("Comment not found") };
          case (?comment) {
            if (comment.author != caller) {
              Runtime.trap("Unauthorized: Cannot delete comment created by another user");
            };

            let updatedComments = post.comments.filter(func(comment) { comment.id != commentId });

            let updatedPost : Post = {
              id = post.id;
              author = post.author;
              content = post.content;
              timestamp = post.timestamp;
              attachments = post.attachments;
              likes = post.likes;
              comments = updatedComments;
            };

            socialFeed.add(postId, updatedPost);
          };
        };
      };
    };
  };

  public query ({ caller }) func getPostAttachments(postId : Text) : async [Attachment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view post attachments");
    };
    switch (socialFeed.get(postId)) {
      case (null) { [] };
      case (?post) { post.attachments };
    };
  };
};
