package MSTEST.service;

import MSTEST.model.UsersModel;
import MSTEST.repository.UsersRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

@Service
public class UsersService {

    BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    private final UsersRepository usersRepository;

    public UsersService(UsersRepository usersRepository){
        this.usersRepository = usersRepository;
    }


    public UsersModel registerUser(String login, String password, String email){
        if (login == null || password == null) {
            return null;
        } else {
            if(usersRepository.findByLogin(login).isPresent()){
                System.out.println("Login already taken");
                return null;
            }
            UsersModel usersModel = new UsersModel();
            usersModel.setLogin(login);
            usersModel.setPassword(bCryptPasswordEncoder.encode(password));
            usersModel.setEmail(email);
            return usersRepository.save(usersModel);
        }
    }

    public UsersModel authenticate(String login, String password){
        try {
            UsersModel loggingUser = usersRepository.findUserByLogin(login);
        if(bCryptPasswordEncoder.matches(password, loggingUser.getPassword())) {
            return usersRepository.findByLogin(login).orElse(null);
        }
        }catch (Exception exception){
            return null;
        }
        return null;
    }
}
