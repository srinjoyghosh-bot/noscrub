/**
 * @class CookieManager
 * @classdesc A utility class for managing secure HTTP cookies with strict security settings.
 * All cookies are set with Secure flag and SameSite=Strict attribute for enhanced security.
 */
class CookieManager {
      /**
     * Sets a secure cookie with optional expiration settings.
     * Also creates a companion cookie storing the expiration date for tracking purposes.
     * 
     * @static
     * @param {string} name - The name of the cookie
     * @param {string} value - The value to store in the cookie
     * @param {number} [expirationDays=1] - Number of days until the cookie expires
     * @param {Date} [expiryDate=null] - Specific date when the cookie should expire
     */
    static setCookie(name, value, expirationDays = 1, expiryDate = null) {
        let expires;
        if (expiryDate instanceof Date) {
            expires =  expiryDate.toUTCString();
        } else {
            const d = new Date();
            d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
            expires =  d.toUTCString();
        }
        document.cookie = `${name}=${value};expires=${expires};path=/;Secure;SameSite=Strict`;
        document.cookie = `${name}-expires=${expires};expires=${expires};path=/;Secure;SameSite=Strict`;
    }

    /**
     * Retrieves the value of a cookie by its name.
     * 
     * @static
     * @param {string} name - The name of the cookie to retrieve
     * @returns {string|null} The cookie value if found, null otherwise
     */
    static getCookie(name) {
        const cookieName = `${name}=`;
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for(let cookie of cookieArray) {
            while (cookie.startsWith(' ')) {
                cookie = cookie.substring(1);
            }
            if (cookie.startsWith(cookieName)) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return null;
    }

    /**
     * Gets the expiration date of a cookie.
     * 
     * @static
     * @param {string} name - The name of the cookie
     * @returns {Date|null} The expiration date if found, null otherwise
     */
    static getCookieExpiryDate(name) {
        const cookieString = document.cookie.split(';').find(cookie => cookie.trim().startsWith(`${name}=`));
        console.log("cookieString",cookieString);
        
        if (!cookieString) return null;

        const expiresMatch = document.cookie.split(';')
            .find(cookie => cookie.trim().toLowerCase().startsWith(`${name}-expires=`));
        console.log("expiresMatch",expiresMatch);
        if (!expiresMatch) return null;

        const expiryDate = new Date(expiresMatch.split('=')[1]);
        return expiryDate;
    }

    /**
     * Checks if a cookie has expired.
     * 
     * @static
     * @param {string} name - The name of the cookie to check
     * @returns {boolean} True if the cookie is expired or doesn't exist, false otherwise
     */
    static isExpired(name) {
        if (!this.hasCookie(name)) {
            console.log("isExpired not have cookie");     
            return true;
        }

        const expiryDate = this.getCookieExpiryDate(name);
        console.log("isExpired expiryDate",expiryDate);
        if (!expiryDate) return true;

        return new Date() > expiryDate;
    }

    /**
     * Deletes a cookie by setting its expiration date to the past.
     * 
     * @static
     * @param {string} name - The name of the cookie to delete
     */
    static deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    /**
     * Checks if a cookie exists and has a non-empty value.
     * 
     * @static
     * @param {string} name - The name of the cookie to check
     * @returns {boolean} True if the cookie exists and has a value, false otherwise
     */
    static hasCookie(name) {
        const cookie=this.getCookie(name)
        return cookie !== null && cookie.length !== 0;
    }

}

export {
    CookieManager
};
