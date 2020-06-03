export class AppUtil {
  public static makeRandomStr(length: number): string {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   *
   * @param {number} n The time to sleep (in milliseconds)
   * @return {Promise}
   * **/

  public static async sleep(n: number) {
    return new Promise((resolve) => setTimeout(resolve, n));
  }
}
