import user from './user.model.js';
import userProfile from './userProfile.model.js';
import passResetRequest from './passResetRequest.model.js';
import userProject from './userProject.model.js';
import userProjectGallery from './userProjectGallery.model.js';
import userEducation from './userEducation.model.js';
import userEducationGallery from './userEducationGallery.model.js';
import userExperience from './userExperience.model.js';
import userExperienceGallery from './userExperienceGallery.model.js';
import publication from './publication.model.js';
import publicationBookmark from './publicationBookmark.model.js';
import post from './post.model.js';
import postComment from './postComment.model.js';
import attachment from './attachment.model.js';
import userSkill from './userSkill.model.js';
import userInterest from './userInterest.model.js';
import rssNews from './rssNews.model.js';
import rssNewsBookmark from './rssNewsBookmark.model.js';
import sharedRssNews from './sharedRssNews.model.js';
import connectionRequest from './connectionRequest.model.js';
import connection from './connection.model.js';
import company from './company.model.js';
import companyDepartment from './companyDepartment.model.js';
import job from './job.model.js';
import jobApplication from './jobApplication.model.js';
import jobInvitation from './jobInvitation.model.js';
import follower from './follower.model.js';
import experienceEndorsement from './experienceEndorsement.model.js';
import projectEndorsement from './projectEndorsement.model.js';
import memo from './memo.model.js';
import reportedUser from './reportedUser.model.js';
import appContent from './appContent.model.js';
import appFaq from './appFaq.model.js';
import chatRoom from './chatRoom.model.js';
import chatParticipant from './chatParticipant.model.js';
import chatMessage from './chatMessage.model.js';
import memoComment from './memoComment.model.js';
import publicationComment from './publicationComment.model.js';
import signupVerifyRequest from './signupVerifyRequest.model.js';
import companyCeo from './companyCeo.model.js';
import ceoEndorsement from './ceoEndorsement.model.js';
import postLike from './postLike.model.js';
import publicationLike from './publicationLike.model.js';
import rssNewsLike from './rssNewsLike.model.js';
import rssNewsComment from './rssNewsComment.model.js';
import rssNewsPreferences from './rssNewsPreferences.model.js';

export default (sequelize, DataTypes) => {
    return [

        // department should be added before company because company is using departments's scope
        companyDepartment(sequelize, DataTypes),

        // company should be added before user because user is using company's scope
        company(sequelize, DataTypes),
        user(sequelize, DataTypes),
        passResetRequest(sequelize, DataTypes),
        userProfile(sequelize, DataTypes),

        // gallery should be added before proects because of scope
        userProjectGallery(sequelize, DataTypes),
        userProject(sequelize, DataTypes),

        // gallery should be added before education because of scope
        userEducationGallery(sequelize, DataTypes),
        userEducation(sequelize, DataTypes),

        // gallery should be added before experience because of scope
        userExperienceGallery(sequelize, DataTypes),
        userExperience(sequelize, DataTypes),
        
        publication(sequelize, DataTypes),
        publicationBookmark(sequelize, DataTypes),
        post(sequelize, DataTypes),
        postComment(sequelize, DataTypes),
        attachment(sequelize, DataTypes),
        userSkill(sequelize, DataTypes),
        userInterest(sequelize, DataTypes),
        rssNews(sequelize, DataTypes),
        rssNewsBookmark(sequelize, DataTypes),
        sharedRssNews(sequelize, DataTypes),
        connectionRequest(sequelize, DataTypes),
        connection(sequelize, DataTypes),
        job(sequelize, DataTypes),
        jobApplication(sequelize, DataTypes),
        jobInvitation(sequelize, DataTypes),
        follower(sequelize, DataTypes),
        experienceEndorsement(sequelize, DataTypes),
        projectEndorsement(sequelize, DataTypes),
        memo(sequelize, DataTypes),
        reportedUser(sequelize, DataTypes),
        appContent(sequelize, DataTypes),
        appFaq(sequelize, DataTypes),
        postLike(sequelize, DataTypes),
        publicationLike(sequelize, DataTypes),
        rssNewsLike(sequelize, DataTypes),
        rssNewsComment(sequelize, DataTypes),
        rssNewsPreferences(sequelize, DataTypes),

        // participant should be added before room because room is using participant's scope
        chatParticipant(sequelize, DataTypes),
        chatMessage(sequelize, DataTypes),
        chatRoom(sequelize, DataTypes),
        memoComment(sequelize, DataTypes),
        publicationComment(sequelize, DataTypes),
        signupVerifyRequest(sequelize, DataTypes),

        companyCeo(sequelize, DataTypes),
        ceoEndorsement(sequelize, DataTypes)
    ];
};