import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin SDK configuration
// Note: In production, store the private key in environment variables
const firebaseAdminConfig = {
  projectId: "housing-complex-ff56c",
  credential: cert({
    projectId: "housing-complex-ff56c",
    privateKey:
      process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ||
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC+E2Ncj5HPdc7E\nz7NPMQFD7KIkcKb7tjrN1NScYXaejXCbmubQKY76L2smIKTtzfbOxVRPf+dCVU7r\ndE/Cm+gMvn73XZkt9WeJr48U5ciL+bI8CZECdD0sNuJ9dBqg9W5FBrm1tp7q1jrT\nB0eQwRv6S705EEhi6c9SHI2zfz1SQdyrYC7gTbOGC3Fko/X/UPEECRUYylfQanVU\nZd2no2DpQuJNCDo+Pos7EXQNVLQ2W+5uUsgjW0qElMcccC8r+W3qDkWdE4H9WLgc\nlCZifA1/rzrbike3HBkvrxdIDq/UHcMce2HjPPoNn8lGU8QNAZgi3bZ/5l/cUNMF\npE247+FLAgMBAAECggEAA5uIr+4YviVRrBxUhwrASuWa0mawab9AXDIDxzWv/FjZ\ntIVDtn4rbvGKdKt7Tpv3RjA196sJNAZTqBYbMIbiixu9758oBYclzuGA56l/LsrA\n8U4iFfIQwBJ9VM7dL8sotzbx30yLWD8N2CCxA+W7eylZTDEaD1bobtcItxsdRG1U\nYrQYUR50183XVZUOgRSUlf9N1JVCSz6CcxaKTasm6m37h/AXxIAqMibebCDAAEnI\nax6Toeud3DyCiz6KP0nwnEJWZ+nDQ369ISgvPLQ/6X2dif/0fnkefS0zEnqQS+ch\nP2ANcdskKsA90FFc4MBp9bIlrA+PgGFusORBStWGgQKBgQDm5PZ9VLdHWxL1XCCJ\nvZLy96+rmUrS0x54jimnkawgLEaAmBbnWNdoRfMva03RAeFx9OBz/Ye3Ye4XS7wy\n1osrgZWSQipRd5zHvxQeHcmF5bwNPHeUfJUnvKOfa36geZZPXul5gR3XzjT4gUG5\na9R2KLS7owBTIRauJWRlo0OTgQKBgQDSvjjMzvsjGS1LDCWXzeQUcAC5f0+0CQDC\n4lb6x1/JhRK6w6RYi8brZfuG6fNAuoPKE12ckyw4oxp9r36Dn64sxpf6Vg7wJO2N\nDh1D35Ts23xJ3lecRHntxKWwyZ5yjT+aSp6G/QN8JyQgA2duZWAG++zFKONofPR9\nlqCeSIbqywKBgQDNWg+7kg/bf62R2Nj7iEZcn1t248Q/UxMDp3R2m0GZ76bYkeu0\n4DfcfnH115qC7AhFIMRLhM4ilA98WphMIrHuBLcxOHWItTgUEuZijp1/373ri77S\nqibCC6z+iU06jkjX2JMPxHz1RWmpJtR8g+GXIUb0ptkQFhqk0Y7EMntUgQKBgQCv\nic0MI/giEy2cDmEd4lzx/R1NZdNA9iLRMfEbcIjD9flU4fN54evuVgM+LI73QqTV\n5G2cJya1gn5lZJGwF4jgOQeMeLR2qXvJe5E64PhOlsAfU3mMa6lYOO1+pWI6rpbk\n8PS9IfEOMBgyJkO4O+7RwnRFAbryZOrN1XKyhV0EIwKBgHkeLh4n66XD3yxW/uDe\nBSY8/+FC30PGASvsfQqez0Tf5Lcx9KRwWZmedqXUfwHsHLZM+WPmua86djbVwg4H\nSs1KhpUm2gvMRypvRbv3MfvjnKLpp2orM7JGxRgFcbV2Jx+9tksVZzA0v4xtg7AS\nqnxzG8GEF+4WLZV0NoRfSmBg\n-----END PRIVATE KEY-----\n",
    clientEmail:
      "firebase-adminsdk-fbsvc@housing-complex-ff56c.iam.gserviceaccount.com",
  }),
};

// Initialize Firebase Admin
let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp(firebaseAdminConfig);
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };

