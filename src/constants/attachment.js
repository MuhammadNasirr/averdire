const defaultPath = 'uploads';
/**
 * Constants for attachment model names
 */
export const POST = {
    value: 1,
    fields: {
        photo: "photo",
        document: "document"
    },
    paths: {
        photo: defaultPath+'/posts/photo'
    }
}

export const USER = {
    value: 2,
    fields: {
        avatar: "avatar",
        coverPhoto: "coverPhoto"
    }
}

export const PUBLICATION = {
    value: 3,
    fields: {
        banner: "banner"
    }
}

export const EXPERIENCE = {
    value: 4,
    fields: {
        photo: "photo"
    }
}

export const EDUCATION = {
    value: 5,
    fields: {
        photo: "photo"
    }
}

export const PROJECT = {
    value: 6,
    fields: {
        photo: "photo"
    }
}

export const COMPANY = {
    value: 7,
    fields: {
        logo: "logo",
        cover: "cover"
    }
}

export const MEMO = {
    value: 8,
    fields: {
        photo: "photo",
        document: "document"
    }
}
