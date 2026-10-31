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

## Property listings

**Property**:
A building, project or plot that an Active developer lists and owns in the product.
_Avoid_: Listing (for the whole record), project (unless the Listing category is Project)

**Listing category**:
Whether a Property is a Single Property or a Project with several units.

**Property status**:
Whether a Property is Ready to move or Under construction. Only an Under construction Property has Construction progress and Construction updates.
_Avoid_: Listing status, availability

**Configuration**:
One unit type of a Property, such as "2 BHK Apartment", with its area, price, total units and available units.
_Avoid_: Unit type (in code and docs), variant, plan

**Floor plan**:
A drawing file attached to a Configuration.

**Feature**:
A descriptive item of a Property shown under "Amenities & Features", such as "Lift" or "24x7 Water Supply". It has no price and cannot be booked.
_Avoid_: Amenity (that word means a Bookable amenity)

**Bookable amenity**:
A facility of a Property that residents can use for a price, such as a gym or a party hall, with one or more Amenity plans.
_Avoid_: Feature, facility (the facility module manages maintenance, not amenities)

**Amenity plan**:
One price of a Bookable amenity for a billing cycle: per hour, per day or per month.

**Property document**:
A file that proves something about a Property, such as a RERA certificate or a legal NOC, with its own review state. Different from a Verification document, which is about the Developer.

**Gallery**:
The images, videos and 360° tours of a Property, in order; the first image is the cover.
_Avoid_: Media library, photos

**Construction progress**:
How far an Under construction Property has come, overall and per phase (foundation, structure, interior, finishing), with an optional possession date.

**Construction update**:
A dated note, with an optional image, that a Developer posts about an Under construction Property.
_Avoid_: News, post (a post belongs to marketing)
