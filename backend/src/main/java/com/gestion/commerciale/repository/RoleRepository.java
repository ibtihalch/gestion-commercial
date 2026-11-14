package com.gestion.commerciale.repository;

import com.gestion.commerciale.entity.ERole;
import com.gestion.commerciale.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByNom(ERole nom);
}
