class CookieManager {
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

    static getCookie(name) {
        const cookieName = `${name}=`;
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for(let cookie of cookieArray) {
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return null;
    }

    static getCookieExpiryDate(name) {
        const cookieString = document.cookie.split(';').find(cookie => cookie.trim().startsWith(`${name}=`));
        console.log("cookieString",cookieString);
        
        if (!cookieString) return null;

        // Find the expires attribute
        const expiresMatch = document.cookie.split(';')
            .find(cookie => cookie.trim().toLowerCase().startsWith(`${name}-expires=`));
        console.log("expiresMatch",expiresMatch);
        if (!expiresMatch) return null;

        const expiryDate = new Date(expiresMatch.split('=')[1]);
        return expiryDate;
    }

    static isExpired(name) {
        // First check if cookie exists
        if (!this.hasCookie(name)) {
            console.log("isExpired not have cookie");     
            return true;
        }

        const expiryDate = this.getCookieExpiryDate(name);
        console.log("isExpired expiryDate",expiryDate);
        if (!expiryDate) return true;

        return new Date() > expiryDate;
    }

    static deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    static hasCookie(name) {
        const cookie=this.getCookie(name)
        return cookie !== null && cookie.length !== 0;
    }

}

export {
    CookieManager
};