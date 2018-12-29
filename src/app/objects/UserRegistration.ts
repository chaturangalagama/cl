export class UserRegistration {
    constructor(
        title: string,
        preferredMethodOfCommunication: string,
        name: string,
        dob: string,
        userId: UserId,
        gender: string,
        contactNumber: Contact,
        status: string,
        address: Address,
        emailAddress: string,
        emergencyContactNumber: Contact,
        company: Company,
        nationality: string,
        maritalStatus: string,
        race: string,
        preferredLanguage: string,
        allergies: Object,
        remarks: string,
        companyId: string
    ) {}
}
export class Company {
    constructor(
        name: string,
        address: string,
        postalCode: string,
        occupation: string
    ) {}
}

export class UserId {
    constructor(idType: string, number: string) {}
}

export class Contact {
    constructor(countryCode: number, number: string) {}
}

export class Address {
    constructor(address: string, country: string, postalCode: string) {}
}
