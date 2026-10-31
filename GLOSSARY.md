# Real Estate

A marketplace where developers list properties they own and buyers find properties to buy.

## People and access

**Account**:
One person's sign-in identity, identified by a single email address. An account can hold several roles.
_Avoid_: User profile, login

**Role**:
What an account is allowed to act as: Buyer, Developer or Admin. One account can be both Buyer and Developer.
_Avoid_: User type, account type

**Buyer**:
An account role for people looking to buy property.
_Avoid_: Customer, client

**Developer**:
An account role for property owners who list properties; it must pass Developer verification before it is active.
_Avoid_: Owner, seller, builder

**Admin**:
An account role for staff who review Verification documents. Never gained through sign-up.
_Avoid_: Moderator, staff user

**Agent**:
A role shown in the designs but deferred; not part of the product yet.

## Sign-up and recovery

**Email verification**:
Proving that the account holder controls the email address by entering a Verification code sent to it.
_Avoid_: Activation, confirmation

**Verification code**:
A 6-digit, short-lived, single-use code sent by email for Email verification or Password reset.
_Avoid_: OTP, PIN, token

**Password reset**:
Replacing a forgotten password after proving control of the account's email with a Verification code.
_Avoid_: Password recovery

## Developer verification

**Professional info**:
The business details a Developer gives during onboarding: company name, type of developer, license number, experience level and location.
_Avoid_: Business profile, KYC form

**Type of Developer**:
Whether a Developer works as an Individual or through a Company.

**Verification document**:
A file a Developer uploads to be verified: Government ID, Company Registration Certificate or Profile Photo.
_Avoid_: Attachment, certificate (for the whole set)

**Document review**:
An Admin's decision on one Verification document: approved, or rejected with a reason.
_Avoid_: Approval process, KYC check

**Verification status**:
A Developer's overall standing, derived from their latest required Verification documents: Under Review, Active or Unsuccessful.
_Avoid_: Approval status, account status

**Active developer**:
A Developer whose required Verification documents are all approved; only they can use developer features.
_Avoid_: Verified developer, approved account

**Resubmission**:
Uploading a new file for a rejected Verification document. Earlier uploads are kept.
_Avoid_: Re-upload, retry

## Staff

**Staff member**:
A person on an Active developer's team, recorded by that developer with name, email, phone, role and status. In this build a record only; does not log in yet.
_Avoid_: Employee, team user, agent (as a person)

**Employer**:
The Active developer who added a Staff member and alone can see or change them.
_Avoid_: Owner, manager

**Staff role**:
The job of a Staff member shown in the staff list: only "Agent" so far. Not an account Role.
_Avoid_: Account role

**Access permission**:
One of five areas a Staff member is granted in full: Properties Management, Leads & CRM, Payment Tracking, Marketing, Facility Management. Stored, not enforced, until staff log in.
_Avoid_: Privilege, right, scope

**Property assignment**:
A link between a Staff member and one of the Employer's own properties.
_Avoid_: Allocation
