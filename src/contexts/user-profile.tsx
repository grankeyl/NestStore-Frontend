import React, { createContext, useContext, useState, useEffect } from "react";
import { IUserProfile } from "@types";

const LOCAL_STORAGE_KEY = "userProfile";

const defaultUserProfile: IUserProfile | null = null;

const UserProfileContext = createContext<{
  userProfile: IUserProfile | null;
  setUserProfile: (profile: IUserProfile | null) => void;
}>({
  userProfile: defaultUserProfile,
  setUserProfile: () => {},
});

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfileState] = useState<IUserProfile | null>(() => {
    const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEY);

    return savedProfile ? JSON.parse(savedProfile) : defaultUserProfile;
  });

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [userProfile]);

  const setUserProfile = (profile: IUserProfile | null) => {
    setUserProfileState(profile);
  };

  return (
    <UserProfileContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
     </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);