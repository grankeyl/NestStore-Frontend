export const shareLink = async (referralLink: string) => {
  try {
    if (navigator.share) {
      await navigator.share({
        url: referralLink,
      });
    } else {
      alert(
        "Your browser does not support this feature. Copy the link manually."
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
